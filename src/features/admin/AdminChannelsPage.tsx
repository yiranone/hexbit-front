import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit3, GitBranch, Link2, Plus, RefreshCw, Search, ShieldOff, UserMinus } from "lucide-react";
import { api, type AdminChannel, type AdminChannelUser, type AdminUser } from "../../api";
import { Confirm, EmptyState, Field, Modal, ModalSave, PageHeader, Panel, ResourceTable, StatusBadge } from "../../shared";

type ChannelForm = { code: string; name: string; description: string; status: "active" | "disabled" };

export function AdminChannelsPage() {
  const [channels, setChannels] = useState<AdminChannel[]>([]);
  const [query, setQuery] = useState("");
  const [edit, setEdit] = useState<AdminChannel | "new" | null>(null);
  const [members, setMembers] = useState<AdminChannel | null>(null);
  const [remove, setRemove] = useState<AdminChannel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const load = async () => { setLoading(true); setError(""); try { setChannels(await api.adminChannels()); } catch (err) { setError(err instanceof Error ? err.message : "渠道数据加载失败"); } finally { setLoading(false); } };
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, []);
  const filtered = useMemo(() => channels.filter((item) => (item.code + item.name + item.description + item.status).toLowerCase().includes(query.toLowerCase())), [channels, query]);
  return <>
    <PageHeader eyebrow="SYSTEM ADMINISTRATION" title="渠道管理" description="普通用户只能归属一个渠道，其实例、网络、存储、订单和同步资源会随用户关系自动归属渠道。" actions={<><button className="button secondary" disabled={loading} onClick={() => void load()}><RefreshCw size={15} />刷新</button><button className="button primary" onClick={() => setEdit("new")}><Plus size={16} />创建渠道</button></>} />
    {error && <div className="security-note"><GitBranch size={18} /><p>{error}</p></div>}
    <Panel><div className="filters"><label className="search"><Search size={16} /><input placeholder="搜索渠道编码、名称或描述" value={query} onChange={(e) => setQuery(e.target.value)} /></label><button className="button secondary" onClick={() => setQuery("")}>重置</button></div><ResourceTable heads={["渠道", "状态", "关联用户", "资源数", "创建时间", "操作"]}>{filtered.map((channel) => <tr key={channel.id}><td><strong>{channel.name}</strong><small>{channel.code} · {channel.id}</small>{channel.description && <small>{channel.description}</small>}</td><td><StatusBadge value={channel.status} /></td><td>{channel.user_count}</td><td>{channel.resource_count}</td><td>{new Date(channel.created_at).toLocaleString("zh-CN")}</td><td><div className="row-actions"><button title="关联渠道用户" onClick={() => setMembers(channel)}><Link2 size={15} /></button><button title="编辑渠道" onClick={() => setEdit(channel)}><Edit3 size={15} /></button><button title="删除渠道" disabled={channel.user_count > 0} onClick={() => setRemove(channel)}><ShieldOff size={15} /></button></div></td></tr>)}</ResourceTable>{filtered.length === 0 && <EmptyState title={query ? "没有匹配渠道" : "暂无渠道"} description="创建渠道后，可将普通用户和其资源归属到对应渠道。" />}</Panel>
    {edit && <ChannelModal value={edit} onClose={() => setEdit(null)} onSaved={async () => { setEdit(null); await load(); }} />}
    {members && <ChannelUsersModal channel={members} onClose={() => setMembers(null)} onSaved={async () => { setMembers(null); await load(); }} />}
    {remove && <Confirm title="删除渠道" message={"确认删除“" + remove.name + "”？只有没有关联用户的渠道才可以删除。"} confirmText="确认删除" onClose={() => setRemove(null)} onConfirm={async () => { try { await api.deleteAdminChannel(remove.id); setRemove(null); await load(); } catch (err) { setError(err instanceof Error ? err.message : "渠道删除失败"); setRemove(null); } }} />}
  </>;
}

function ChannelModal({ value, onClose, onSaved }: { value: AdminChannel | "new"; onClose: () => void; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState<ChannelForm>(() => value === "new" ? { code: "", name: "", description: "", status: "active" } : { code: value.code, name: value.name, description: value.description, status: value.status === "disabled" ? "disabled" : "active" });
  const [error, setError] = useState("");
  const set = (key: keyof ChannelForm, next: string) => setForm((current) => ({ ...current, [key]: next } as ChannelForm));
  const validCode = /^[a-z0-9][a-z0-9-]{1,63}$/.test(form.code);
  return <Modal title={value === "new" ? "创建渠道" : "编辑渠道"} description="渠道编码用于系统识别，创建后不可修改；关联用户后其资源会自动计入渠道。" onClose={onClose}><div className="form-grid"><Field label="渠道编码" required hint="2-64 位小写字母、数字或短横线"><input disabled={value !== "new"} value={form.code} onChange={(e) => set("code", e.target.value)} /></Field><Field label="渠道名称" required><input value={form.name} onChange={(e) => set("name", e.target.value)} /></Field><Field label="描述"><input value={form.description} onChange={(e) => set("description", e.target.value)} /></Field><Field label="状态"><select value={form.status} onChange={(e) => set("status", e.target.value)}><option value="active">启用</option><option value="disabled">停用</option></select></Field></div>{error && <p className="form-error">{error}</p>}<ModalSave disabled={!validCode || !form.name.trim()} onClose={onClose} onSave={async () => { try { setError(""); if (value === "new") await api.createAdminChannel(form); else await api.updateAdminChannel(value.id, form); await onSaved(); } catch (err) { setError(err instanceof Error ? err.message : "渠道保存失败"); } }} /></Modal>;
}

function ChannelUsersModal({ channel, onClose, onSaved }: { channel: AdminChannel; onClose: () => void; onSaved: () => Promise<void> }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [bound, setBound] = useState<AdminChannelUser[]>([]);
  const [userId, setUserId] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(async () => { try { const [all, current] = await Promise.all([api.adminUsers(), api.adminChannelUsers(channel.id)]); setUsers(all.filter((item) => item.role === "member" || item.role === "viewer")); setBound(current); } catch (err) { setError(err instanceof Error ? err.message : "渠道用户加载失败"); } }, [channel.id]);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);
  const available = users.filter((item) => !bound.some((member) => member.user_id === item.id));
  return <Modal wide title={"关联渠道用户 · " + channel.name} description="每个普通用户只能归属一个渠道，重新关联会从原渠道移出；用户拥有的资源会随关系更新。" onClose={onClose}><div className="form-grid"><Field label="选择普通用户" required><select value={userId} onChange={(e) => setUserId(e.target.value)}><option value="">请选择用户</option>{available.map((item) => <option key={item.id} value={item.id}>{item.display_name} · {item.email}</option>)}</select></Field><div className="field"><span>&nbsp;</span><button className="button primary" disabled={!userId} onClick={async () => { try { await api.bindAdminChannelUser(channel.id, userId); setUserId(""); await load(); await onSaved(); } catch (err) { setError(err instanceof Error ? err.message : "关联用户失败"); } }}><Link2 size={15} />关联用户</button></div></div><ResourceTable heads={["用户", "角色", "状态", "关联时间", "操作"]}>{bound.map((item) => <tr key={item.user_id}><td><strong>{item.display_name}</strong><small>{item.email} · {item.user_id}</small></td><td>{item.role === "viewer" ? "只读用户" : "普通成员"}</td><td><StatusBadge value={item.status} /></td><td>{new Date(item.created_at).toLocaleString("zh-CN")}</td><td><button className="text-button" onClick={async () => { try { await api.unbindAdminChannelUser(channel.id, item.user_id); await load(); } catch (err) { setError(err instanceof Error ? err.message : "移出渠道失败"); } }}><UserMinus size={14} />移出渠道</button></td></tr>)}</ResourceTable>{bound.length === 0 && <EmptyState title="暂无关联用户" description="选择普通用户后即可建立渠道归属。" />}{error && <p className="form-error">{error}</p>}<div className="modal-actions"><button className="button secondary" onClick={onClose}>关闭</button></div></Modal>;
}
