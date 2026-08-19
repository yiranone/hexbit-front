import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronRight, Edit3, Play, RotateCw, ShieldCheck, Square,
} from "lucide-react";
import { id, useConsoleStore } from "../../store";
import { api } from "../../api";
import type { Instance } from "../../domain";
import {
  EmptyState, formatShortDateTime as fmt, PageHeader, Panel, StatusBadge, Tabs,
} from "../../shared";
import { EditInstanceModal } from "./InstanceDialogs";


export function InstanceDetailPage() {
  const { instanceId = "" } = useParams(); const { state, mutate, loading } = useConsoleStore(); const navigate = useNavigate(); const instance = state.instances.find((item) => item.id === instanceId); const [tab, setTab] = useState("监控"); const [edit, setEdit] = useState(false);
  if (!instance) return <><PageHeader title="实例不存在" description="该实例可能已被删除，或链接地址不正确。" /><EmptyState title="找不到实例" action={<button className="button primary" onClick={() => navigate("/instances")}>返回实例列表</button>} /></>;
  const vpc = state.vpcs.find((item) => item.id === instance.vpcId);
  const subnet = state.subnets.find((item) => item.id === instance.subnetId);
  const securityGroups = instance.securityGroupIds.map((groupId) => ({ id: groupId, group: state.securityGroups.find((item) => item.id === groupId) }));
  const resourceLabel = (name: string | undefined, resourceId: string, empty = "未关联") => name ? `${name} (${resourceId})` : resourceId || empty;
  const action = async (status: "running" | "stopped", text: string, providerAction: "start" | "stop" | "restart") => {
    if (instance.source === "aliyun-sync" && !instance.providerAccountId) { window.alert("该实例来自未绑定账号的阿里云同步快照，请先在系统管理中绑定云账号后再执行生命周期操作"); return; }
    try {
      await api.instanceAction(instance.id, providerAction);
      await mutate((s) => ({ ...s, instances: s.instances.map((i) => i.id === instance.id ? { ...i, status } : i), logs: [{ id: id("log"), instanceId: instance.id, action: text, operator: "admin", result: "成功", createdAt: new Date().toISOString() }, ...s.logs] }), `${text}操作成功`);
    } catch (error) {
      window.alert(error instanceof Error ? `${text}失败：${error.message}` : `${text}失败`);
    }
  };
  return <><PageHeader title={instance.name} description={`${instance.id} · ${instance.region} / ${instance.zone}`} actions={<><button className="button secondary" onClick={() => navigate("/instances")}><ChevronRight className="flip" size={16} />返回列表</button>{instance.status === "running" ? <button className="button secondary" disabled={loading} onClick={() => action("stopped", "停止实例", "stop")}><Square size={15} />停止</button> : <button className="button primary" disabled={loading} onClick={() => action("running", "启动实例", "start")}><Play size={15} />启动</button>}<button className="button secondary" disabled={loading || instance.status !== "running"} onClick={() => action("running", "重启实例", "restart")}><RotateCw size={15} />重启</button><button className="button secondary" onClick={() => setEdit(true)}><Edit3 size={15} />编辑</button></>} />
    <div className="instance-hero"><div><StatusBadge value={instance.status} /><strong>{instance.cpu} vCPU · {instance.memory} GiB</strong><span>{instance.gpu}</span></div><div><span>私有 IP</span><code>{instance.privateIp}</code></div><div><span>公网 IP</span><code>{instance.publicIp}</code></div><div><span>计费方式</span><strong>{instance.billing === "monthly" ? "包月" : "按量"}</strong></div></div>
    <Tabs items={["概览", "监控", "网络与安全", "磁盘", "操作日志", "续费"]} value={tab} onChange={setTab} />
    {tab === "概览" && <div className="two-column"><Panel title="基础信息"><dl className="detail-list"><dt>实例 ID</dt><dd><code>{instance.id}</code></dd><dt>实例名称</dt><dd>{instance.name}</dd><dt>创建时间</dt><dd>{fmt(instance.createdAt)}</dd><dt>镜像</dt><dd>{instance.image}</dd><dt>可用区</dt><dd>{instance.region} / {instance.zone}</dd><dt>资源组</dt><dd>{state.resourceGroups.find((g) => g.id === instance.resourceGroupId)?.name ?? "默认资源组"}</dd></dl></Panel><Panel title="计算配置"><dl className="detail-list"><dt>vCPU</dt><dd>{instance.cpu} 核</dd><dt>内存</dt><dd>{instance.memory} GiB</dd><dt>GPU</dt><dd>{instance.gpu}</dd><dt>系统盘</dt><dd>{instance.systemDisk} GiB ESSD</dd><dt>自动续费</dt><dd>{instance.autoRenew ? "已开启" : "未开启"}</dd></dl></Panel></div>}
    {tab === "监控" && <MonitorCharts instance={instance} />}
    {tab === "网络与安全" && <div className="two-column"><Panel title="网络信息"><dl className="detail-list"><dt>VPC</dt><dd>{resourceLabel(vpc?.name, instance.vpcId)}</dd><dt>子网 / 交换机</dt><dd>{resourceLabel(subnet?.name, instance.subnetId)}</dd><dt>可用区</dt><dd>{instance.zone || "未返回"}</dd><dt>网络类型</dt><dd>{instance.networkType || "专有网络"}</dd><dt>私有 IP</dt><dd>{instance.privateIp || "未分配"}</dd><dt>公网 IP</dt><dd>{instance.publicIp || "未分配"}</dd><dt>公网带宽</dt><dd>{instance.bandwidth ? `${instance.bandwidth} Mbps 入方向 / ${instance.bandwidthOut || instance.bandwidth} Mbps 出方向` : "未返回"}</dd></dl></Panel><Panel title="安全组">{securityGroups.length ? securityGroups.map(({ id: groupId, group }) => <div className="security-item" key={groupId}><ShieldCheck size={18} /><div><strong>{group ? `${group.name} (${groupId})` : groupId}</strong><span>{group ? `${group.rules.length} 条规则 · ${group.description || "无描述"}` : "已关联安全组，规则详情待同步"}</span></div></div>) : <EmptyState title="未关联安全组" description="阿里云未返回该实例的安全组关联信息。" />}</Panel></div>}
    {tab === "磁盘" && <Panel title="磁盘列表"><div className="table-scroll"><table><thead><tr><th>磁盘名称</th><th>类型</th><th>容量</th><th>状态</th></tr></thead><tbody><tr><td>系统盘</td><td>ESSD</td><td>{instance.systemDisk} GiB</td><td><StatusBadge value="in-use" /></td></tr>{state.disks.filter((d) => d.instanceId === instance.id).map((disk) => <tr key={disk.id}><td>{disk.name}</td><td>{disk.type}</td><td>{disk.size} GiB</td><td><StatusBadge value={disk.status} /></td></tr>)}</tbody></table></div></Panel>}
    {tab === "操作日志" && <Panel title="操作日志"><div className="timeline">{state.logs.filter((log) => log.instanceId === instance.id).map((log) => <article key={log.id}><i /><div><strong>{log.action}</strong><span>{log.operator} · {fmt(log.createdAt)}</span></div><StatusBadge value={log.result} /></article>)}</div></Panel>}
    {tab === "续费" && <Panel title="续费信息"><div className="renew-box"><div><span>计费方式</span><strong>{instance.billing === "monthly" ? "包月" : "按量计费"}</strong></div><div><span>到期时间</span><strong>{instance.expiresAt ? fmt(instance.expiresAt) : "无固定到期时间"}</strong></div><label className="switch-row"><input type="checkbox" checked={instance.autoRenew} onChange={(e) => mutate((s) => ({ ...s, instances: s.instances.map((i) => i.id === instance.id ? { ...i, autoRenew: e.target.checked } : i) }), e.target.checked ? "已开启自动续费" : "已关闭自动续费")} /><span>自动续费</span></label><button className="button primary" disabled={state.balance < instance.price} onClick={() => mutate((s) => { const orderId = id("ord"); const paidAt = new Date().toISOString(); return { ...s, balance: s.balance - instance.price, instances: s.instances.map((i) => i.id === instance.id ? { ...i, expiresAt: new Date(new Date(i.expiresAt ?? Date.now()).getTime() + 30 * 86400000).toISOString() } : i), orders: [{ id: orderId, instanceId: instance.id, resourceName: instance.name, type: "renewal", status: "successful", amount: instance.price, createdAt: paidAt, paidAt }, ...s.orders], billing: [{ id: id("bill"), type: "consume", product: "云服务器续费", amount: -instance.price, createdAt: paidAt, orderId }, ...s.billing] }; }, "续费成功并写入订单与账单")}>立即续费</button></div></Panel>}
    {edit && instance.source !== "aliyun-sync" && <EditInstanceModal instance={instance} onClose={() => setEdit(false)} />}</>;
}

function MonitorCharts({ instance }: { instance: Instance }) { const sets = [{ label: "CPU 使用率", value: 38, unit: "%", color: "blue" }, { label: "内存使用率", value: 62, unit: "%", color: "green" }, { label: "磁盘使用率", value: 46, unit: "%", color: "orange" }, { label: "网络流入", value: 128, unit: "Mbps", color: "red" }]; return <div className="chart-grid">{sets.map((set, chart) => <Panel key={set.label} title={set.label} description={`实例 ${instance.name} · 最近 24 小时`}><div className="chart-summary"><strong>{set.value}<small>{set.unit}</small></strong><span>峰值 {Math.round(set.value * 1.35)} {set.unit}</span></div><div className={`bar-chart ${set.color}`}>{Array.from({ length: 24 }, (_, i) => <i key={i} style={{ height: `${18 + ((i * 17 + chart * 23) % 72)}%` }} />)}</div><div className="chart-axis"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>现在</span></div></Panel>)}</div>; }
