import { useState } from "react";
import { Edit3, Eye, Plus, Trash2 } from "lucide-react";
import { api } from "../../api";
import { useConsoleStore } from "../../store";
import type { PublicIp, SecurityGroup, Subnet, Vpc } from "../../domain";
import { Confirm, PageHeader, Panel, ResourceTable, StatusBadge, Tabs } from "../../shared";
import { PublicIpModal } from "./eip/EipDialog";
import { SecurityGroupModal, SecurityRulesModal } from "./security-group/SecurityGroupDialogs";
import { SubnetModal } from "./subnet/SubnetDialog";
import { VpcDetailModal, VpcModal } from "./vpc/VpcDialogs";

type RemoveTarget = { kind: "vpc" | "subnet" | "ip" | "sg"; id: string; name: string };

export function NetworkPage() {
  const { state, mutate } = useConsoleStore();
  const [tab, setTab] = useState("VPC");
  const [vpcDetail, setVpcDetail] = useState<string | null>(null);
  const [vpcEdit, setVpcEdit] = useState<Vpc | "new" | null>(null);
  const [subnetEdit, setSubnetEdit] = useState<Subnet | "new" | null>(null);
  const [ipEdit, setIpEdit] = useState<PublicIp | "new" | null>(null);
  const [sgEdit, setSgEdit] = useState<SecurityGroup | "new" | null>(null);
  const [sgRules, setSgRules] = useState<string | null>(null);
  const [remove, setRemove] = useState<RemoveTarget | null>(null);
  const region = state.selectedRegion;
  const vpcs = state.vpcs.filter((vpc) => !region || vpc.region === region);
  const subnets = state.subnets.filter((subnet) => !region || subnet.region === region || vpcs.some((vpc) => vpc.id === subnet.vpcId));
  const securityGroups = state.securityGroups.filter((group) => !region || group.region === region || vpcs.some((vpc) => vpc.id === group.vpcId));
  const publicIps = state.publicIps.filter((ip) => !region || ip.region === region);

  const eipAction = async (ip: PublicIp, instanceId?: string) => {
    try {
      if (ip.status === "bound") await api.unassociateCloudEip(ip.id);
      else if (instanceId) await api.associateCloudEip(ip.id, instanceId);
      const saved = await mutate((s) => ({ ...s, publicIps: s.publicIps.map((item) => item.id === ip.id ? { ...item, status: ip.status === "bound" ? "available" : "bound", instanceId: ip.status === "bound" ? undefined : instanceId } : item) }), ip.status === "bound" ? "公网 IP 已解绑" : "公网 IP 已绑定");
      if (!saved) return;
    } catch (error) {
      window.alert(error instanceof Error ? `公网 IP 操作失败：${error.message}` : "公网 IP 操作失败");
    }
  };

  const removeResource = async (item: RemoveTarget) => {
    try {
      if (item.kind === "vpc") await api.deleteCloudVpc(item.id);
      else if (item.kind === "subnet") await api.deleteCloudSubnet(item.id);
      else if (item.kind === "ip") await api.releaseCloudEip(item.id);
      else await api.deleteCloudSecurityGroup(item.id);
    } catch (error) {
      window.alert(error instanceof Error ? `资源删除失败：${error.message}` : "资源删除失败");
      return;
    }
    const saved = await mutate((s) => item.kind === "vpc" ? { ...s, vpcs: s.vpcs.filter((vpc) => vpc.id !== item.id) } : item.kind === "subnet" ? { ...s, subnets: s.subnets.filter((subnet) => subnet.id !== item.id) } : item.kind === "ip" ? { ...s, publicIps: s.publicIps.filter((ip) => ip.id !== item.id) } : { ...s, securityGroups: s.securityGroups.filter((group) => group.id !== item.id) }, item.kind === "ip" ? "公网 IP 已释放" : `已删除${item.kind === "vpc" ? " VPC" : item.kind === "subnet" ? "子网" : "安全组"}`);
    if (saved) setRemove(null);
  };

  return <>
    <PageHeader title="网络与 VPC" description="管理私有网络、子网、公网 IP 和安全访问规则。" actions={<button className="button primary" onClick={() => setVpcEdit("new")}><Plus size={16} />创建 VPC</button>} />
    <Panel><Tabs items={["VPC", "子网", "公网 IP", "安全组"]} value={tab} onChange={setTab} />
      {tab === "VPC" && <ResourceTable heads={["名称 / ID", "CIDR", "区域", "子网", "状态", "操作"]}>{vpcs.map((vpc) => { const referenced = subnets.some((subnet) => subnet.vpcId === vpc.id) || state.instances.some((instance) => instance.vpcId === vpc.id) || securityGroups.some((group) => group.vpcId === vpc.id); return <tr key={vpc.id}><td><strong>{vpc.name}</strong><small>{vpc.id}</small></td><td><code>{vpc.cidr}</code></td><td>{vpc.region}</td><td>{subnets.filter((subnet) => subnet.vpcId === vpc.id).length}</td><td><StatusBadge value={vpc.status} /></td><td><div className="row-actions"><button title="查看详情" onClick={() => setVpcDetail(vpc.id)}><Eye size={15} /></button><button title="编辑" onClick={() => setVpcEdit(vpc)}><Edit3 size={15} /></button><button title={referenced ? "请先删除或迁移关联资源" : "删除"} disabled={referenced} onClick={() => setRemove({ kind: "vpc", id: vpc.id, name: vpc.name })}><Trash2 size={15} /></button></div></td></tr>; })}</ResourceTable>}
      {tab === "子网" && <><div className="tab-actions"><span>子网用于划分 VPC 内的地址空间。</span><button className="button primary" onClick={() => setSubnetEdit("new")}><Plus size={15} />创建子网</button></div><ResourceTable heads={["子网名称", "所属 VPC", "区域", "CIDR", "可用区", "可用 IP", "操作"]}>{subnets.map((subnet) => { const referenced = state.instances.some((instance) => instance.subnetId === subnet.id); return <tr key={subnet.id}><td><strong>{subnet.name}</strong><small>{subnet.id}</small></td><td>{state.vpcs.find((vpc) => vpc.id === subnet.vpcId)?.name}</td><td>{subnet.region}</td><td><code>{subnet.cidr}</code></td><td>{subnet.zone}</td><td>{subnet.availableIps}</td><td><div className="row-actions"><button title="编辑" onClick={() => setSubnetEdit(subnet)}><Edit3 size={15} /></button><button title={referenced ? "请先迁移关联实例" : "删除"} disabled={referenced} onClick={() => setRemove({ kind: "subnet", id: subnet.id, name: subnet.name })}><Trash2 size={15} /></button></div></td></tr>; })}</ResourceTable></>}
      {tab === "公网 IP" && <><div className="tab-actions"><span>独立公网 IP 可在实例之间解绑和重新绑定。</span><button className="button primary" onClick={() => setIpEdit("new")}><Plus size={15} />申请公网 IP</button></div><ResourceTable heads={["公网 IP", "区域", "带宽", "状态", "绑定资源", "操作"]}>{publicIps.map((ip) => { const target = state.instances.find((instance) => instance.region === region); return <tr key={ip.id}><td><strong>{ip.address}</strong><small>{ip.id}</small></td><td>{ip.region}</td><td>{ip.bandwidth} Mbps</td><td><StatusBadge value={ip.status} /></td><td>{state.instances.find((instance) => instance.id === ip.instanceId)?.name ?? "-"}</td><td><div className="row-actions"><button title="编辑带宽" onClick={() => setIpEdit(ip)}><Edit3 size={15} /></button>{ip.status === "bound" ? <button className="text-button" onClick={() => eipAction(ip)}>解绑</button> : <button className="text-button" disabled={!target} onClick={() => eipAction(ip, target?.id)}>绑定</button>}<button title={ip.status === "bound" ? "请先解绑公网 IP" : "释放"} disabled={ip.status === "bound"} onClick={() => setRemove({ kind: "ip", id: ip.id, name: ip.address })}><Trash2 size={15} /></button></div></td></tr>; })}</ResourceTable></>}
      {tab === "安全组" && <><div className="tab-actions"><span>安全组规则控制实例的入站与出站流量。</span><button className="button primary" onClick={() => setSgEdit("new")}><Plus size={15} />创建安全组</button></div><ResourceTable heads={["安全组", "所属 VPC", "区域", "规则数", "描述", "操作"]}>{securityGroups.map((group) => { const referenced = state.instances.some((instance) => instance.securityGroupIds.includes(group.id)); return <tr key={group.id}><td><strong>{group.name}</strong><small>{group.id}</small></td><td>{state.vpcs.find((vpc) => vpc.id === group.vpcId)?.name}</td><td>{group.region}</td><td>{group.rules.length}</td><td>{group.description}</td><td><div className="row-actions"><button className="text-button" onClick={() => setSgRules(group.id)}>管理规则</button><button title="编辑安全组" onClick={() => setSgEdit(group)}><Edit3 size={15} /></button><button title={referenced ? "请先从实例移除该安全组" : "删除"} disabled={referenced} onClick={() => setRemove({ kind: "sg", id: group.id, name: group.name })}><Trash2 size={15} /></button></div></td></tr>; })}</ResourceTable></>}
    </Panel>
    {vpcDetail && <VpcDetailModal vpcId={vpcDetail} onClose={() => setVpcDetail(null)} />}{vpcEdit && <VpcModal value={vpcEdit} onClose={() => setVpcEdit(null)} />}{subnetEdit && <SubnetModal value={subnetEdit} onClose={() => setSubnetEdit(null)} />}{ipEdit && <PublicIpModal value={ipEdit} onClose={() => setIpEdit(null)} />}{sgEdit && <SecurityGroupModal value={sgEdit} onClose={() => setSgEdit(null)} />}{sgRules && <SecurityRulesModal groupId={sgRules} onClose={() => setSgRules(null)} />}{remove && <Confirm title={`${remove.kind === "ip" ? "释放公网 IP" : `删除${remove.kind === "vpc" ? " VPC" : remove.kind === "subnet" ? "子网" : "安全组"}`}`} message={`确定${remove.kind === "ip" ? "释放" : "删除"}“${remove.name}”吗？操作后无法恢复。`} onClose={() => setRemove(null)} onConfirm={() => removeResource(remove)} />}
  </>;
}
