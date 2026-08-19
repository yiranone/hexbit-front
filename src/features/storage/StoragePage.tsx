import { useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { useConsoleStore } from "../../store";
import { api } from "../../api";
import type { Disk } from "../../domain";
import { Confirm, Field, formatDateTime as fmt, Metric, Modal, ModalSave, PageHeader, Panel, ResourceTable, StatusBadge } from "../../shared";

export function StoragePage() {
  const { state, mutate } = useConsoleStore();
  const [create, setCreate] = useState(false);
  const [remove, setRemove] = useState<Disk | null>(null);
  const [query, setQuery] = useState("");
  const disks = state.disks.filter((disk) => (!state.selectedRegion || disk.region === state.selectedRegion) && (!query || `${disk.name}${disk.id}`.toLowerCase().includes(query.toLowerCase())));

  const diskAction = async (disk: Disk, instanceId?: string) => {
    const target = instanceId || disk.instanceId;
    try {
      if (target) {
        if (disk.status === "available") await api.attachCloudDisk(disk.id, target);
        else await api.detachCloudDisk(disk.id, target);
      }
      const saved = await mutate((s) => ({ ...s, disks: s.disks.map((item) => item.id === disk.id ? { ...item, status: item.status === "available" ? "in-use" : "available", instanceId: item.status === "available" ? target : undefined } : item) }), disk.status === "available" ? "云盘已挂载到首台实例" : "云盘已卸载");
      if (!saved) return;
    } catch (error) {
      window.alert(error instanceof Error ? `云盘操作失败：${error.message}` : "云盘操作失败");
    }
  };

  return <>
    <PageHeader title="存储管理" description="创建和管理独立云盘，并将云盘挂载到计算实例。" actions={<button className="button primary" onClick={() => setCreate(true)}><Plus size={16} />创建云盘</button>} />
    <div className="metrics-grid three"><Metric label="云盘总数" value={disks.length} detail="当前区域" /><Metric label="总容量" value={`${disks.reduce((sum, disk) => sum + disk.size, 0)} GiB`} detail="云平台返回" /><Metric label="可挂载" value={disks.filter((disk) => disk.status === "available").length} detail="当前未挂载云盘" tone="green" /></div>
    <Panel><div className="filters"><label className="search"><Search size={16} /><input placeholder="搜索云盘名称或 ID" value={query} onChange={(event) => setQuery(event.target.value)} /></label><button className="button secondary" onClick={() => setQuery("")}>重置</button></div>
      <ResourceTable heads={["云盘名称 / ID", "区域", "类型", "容量", "状态", "挂载实例", "创建时间", "操作"]}>{disks.map((disk) => <tr key={disk.id}><td><strong>{disk.name}</strong><small>{disk.id}</small></td><td>{disk.region || "-"}</td><td>{disk.type}</td><td>{disk.size} GiB</td><td><StatusBadge value={disk.status} /></td><td>{state.instances.find((instance) => instance.id === disk.instanceId)?.name ?? "-"}</td><td>{fmt(disk.createdAt)}</td><td><div className="row-actions">{disk.status === "available" ? <button className="text-button" disabled={!state.instances.some((instance) => instance.region === state.selectedRegion)} onClick={() => diskAction(disk, state.instances.find((instance) => instance.region === state.selectedRegion)?.id)}>挂载</button> : <button className="text-button" onClick={() => diskAction(disk)}>卸载</button>}<button title="删除" onClick={() => setRemove(disk)}><Trash2 size={15} /></button></div></td></tr>)}</ResourceTable>
      {disks.length === 0 && <div className="empty-state"><strong>暂无当前区域云盘</strong><span>切换区域或创建新的云盘。</span></div>}
    </Panel>
    {create && <DiskModal onClose={() => setCreate(false)} />}
    {remove && <Confirm title="删除云盘" message={`确定删除“${remove.name}”吗？删除后数据无法恢复。`} onClose={() => setRemove(null)} onConfirm={async () => { try { await api.deleteCloudDisk(remove.id); } catch (error) { window.alert(error instanceof Error ? `云盘删除失败：${error.message}` : "云盘删除失败"); return; } const saved = await mutate((s) => ({ ...s, disks: s.disks.filter((disk) => disk.id !== remove.id) }), "云盘已删除"); if (saved) setRemove(null); }} />}
  </>;
}

function DiskModal({ onClose }: { onClose: () => void }) {
  const { state, mutate } = useConsoleStore();
  const [name, setName] = useState("");
  const [size, setSize] = useState(20);
  const [type, setType] = useState<"SSD" | "ESSD">("ESSD");
  const region = state.selectedRegion || state.vpcs[0]?.region || "";
  const zone = state.subnets.find((item) => item.region === region)?.zone || "";
  return <Modal title="创建云盘" onClose={onClose}><div className="form-grid"><Field label="云盘区域"><input value={region || "未同步"} readOnly /></Field><Field label="云盘名称"><input value={name} onChange={(event) => setName(event.target.value)} /></Field><Field label="云盘类型"><select value={type} onChange={(event) => setType(event.target.value as "SSD" | "ESSD")}><option>ESSD</option><option>SSD</option></select></Field><Field label={`容量 ${size} GiB`}><input type="range" min="20" max="2000" step="20" value={size} onChange={(event) => setSize(Number(event.target.value))} /></Field></div><p className="form-hint">可用区：{zone || "未同步"}</p><ModalSave disabled={!name || !region || !zone} onClose={onClose} onSave={async () => { let remoteId = ""; try { remoteId = (await api.createCloudDisk({ region_id: region, zone_id: zone, name: name.trim(), category: type === "ESSD" ? "cloud_essd" : "cloud_ssd", size_gib: size })).id; } catch (error) { window.alert(error instanceof Error ? `云盘创建失败：${error.message}` : "云盘创建失败"); return; } const saved = await mutate((s) => ({ ...s, disks: [{ id: remoteId, name, size, type, region, zone, status: "available", createdAt: "" }, ...s.disks] }), "云盘已创建，请刷新同步云平台状态"); if (saved) onClose(); }} /></Modal>;
}
