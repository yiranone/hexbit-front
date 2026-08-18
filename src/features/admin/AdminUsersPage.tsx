import { useEffect, useMemo, useState } from "react";
import { Edit3, Plus, RefreshCw, Search, ShieldOff, UserCog } from "lucide-react";
import { api, type AdminUser } from "../../api";
import { Confirm, EmptyState, Field, Modal, ModalSave, PageHeader, Panel, ResourceTable, StatusBadge } from "../../shared";

type UserForm = { display_name: string; password: string; role: "member" | "viewer"; status: "active" | "disabled" };

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [edit, setEdit] = useState<AdminUser | "new" | null>(null);
  const [remove, setRemove] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const load = async () => { setLoading(true); setError(""); try { setUsers(await api.adminUsers()); } catch (err) { setError(err instanceof Error ? err.message : "用户数据加载失败"); } finally { setLoading(false); } };
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, []);
  const filtered = useMemo(() => users.filter((user) => `${user.display_name}${user.email}${user.role}${user.status}`.toLowerCase().includes(query.toLowerCase())), [users, query]);
  return <>
    <PageHeader eyebrow="SYSTEM ADMINISTRATION" title="用户管理" description="系统管理员管理平台用户，并为普通用户分配成员或只读角色。" actions={<><button className="button secondary" disabled={loading} onClick={() => void load()}><RefreshCw size={15} />刷新</button><button className="button primary" onClick={() => setEdit("new")}><Plus size={16} />创建普通用户</button></>} />
    {error && <div className="security-note"><UserCog size={18} /><p>{error}</p></div>}
    <Panel><div className="filters"><label className="search"><Search size={16} /><input placeholder="搜索姓名、邮箱或角色" value={query} onChange={(e) => setQuery(e.target.value)} /></label><button className="button secondary" onClick={() => setQuery("")}>重置</button></div><ResourceTable heads={["用户", "角色", "状态", "创建时间", "操作"]}>{filtered.map((user) => { const ordinary = user.role === "member" || user.role === "viewer"; return <tr key={user.id}><td><strong>{user.display_name}</strong><small>{user.email} · {user.id}</small></td><td>{user.role === "member" ? "普通成员" : user.role === "viewer" ? "只读用户" : user.role === "admin" ? "系统管理员" : "所有者"}</td><td><StatusBadge value={user.status} /></td><td>{new Date(user.created_at).toLocaleString("zh-CN")}</td><td><div className="row-actions">{ordinary && <button title="编辑用户" onClick={() => setEdit(user)}><Edit3 size={15} /></button>}{ordinary && <button title="停用用户" disabled={user.status === "disabled"} onClick={() => setRemove(user)}><ShieldOff size={15} /></button>}</div></td></tr>; })}</ResourceTable>{filtered.length === 0 && <EmptyState title={query ? "没有匹配用户" : "暂无用户"} description="创建普通用户后，可在这里调整角色和状态。" />}</Panel>
    {edit && <UserModal value={edit} onClose={() => setEdit(null)} onSaved={async () => { setEdit(null); await load(); }} />}
    {remove && <Confirm title="停用用户" message={`停用“${remove.display_name}”后，该用户将无法登录，已有资源数据会保留。`} confirmText="确认停用" onClose={() => setRemove(null)} onConfirm={async () => { await api.disableAdminUser(remove.id); setRemove(null); await load(); }} />}
  </>;
}

function UserModal({ value, onClose, onSaved }: { value: AdminUser | "new"; onClose: () => void; onSaved: () => Promise<void> }) {
  const [email, setEmail] = useState(value === "new" ? "" : value.email);
  const [form, setForm] = useState<UserForm>(() => value === "new" ? { display_name: "", password: "", role: "member", status: "active" } : { display_name: value.display_name, password: "", role: value.role === "viewer" ? "viewer" : "member", status: value.status === "disabled" ? "disabled" : "active" });
  const [error, setError] = useState(""); const set = (key: keyof UserForm, next: string) => setForm((current) => ({ ...current, [key]: next } as UserForm));
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  return <Modal title={value === "new" ? "创建普通用户" : "编辑用户"} description="普通用户只能分配成员或只读角色，不能获得系统管理员权限。" onClose={onClose}><div className="form-grid"><Field label="登录邮箱" required><input type="email" disabled={value !== "new"} value={email} onChange={(e) => setEmail(e.target.value)} /></Field><Field label="显示名称" required><input value={form.display_name} onChange={(e) => set("display_name", e.target.value)} /></Field><Field label={value === "new" ? "初始密码" : "重置密码（可选）"} required={value === "new"}><input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} /></Field><Field label="角色"><select value={form.role} onChange={(e) => set("role", e.target.value)}><option value="member">普通成员</option><option value="viewer">只读用户</option></select></Field>{value !== "new" && <Field label="状态"><select value={form.status} onChange={(e) => set("status", e.target.value)}><option value="active">启用</option><option value="disabled">停用</option></select></Field>}</div>{error && <p className="form-error">{error}</p>}<ModalSave disabled={!validEmail || !form.display_name.trim() || (value === "new" && form.password.length < 8)} onClose={onClose} onSave={async () => { try { setError(""); if (value === "new") await api.createAdminUser({ email, password: form.password, display_name: form.display_name, role: form.role }); else await api.updateAdminUser(value.id, form); await onSaved(); } catch (err) { setError(err instanceof Error ? err.message : "保存失败"); } }} /></Modal>;
}
