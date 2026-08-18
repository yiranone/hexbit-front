import { useEffect, useMemo, useState } from "react";
import { Edit3, Link2, Plus, RefreshCw, Search, ShieldOff } from "lucide-react";
import { api, type AdminAccountUser, type AdminAlibabaAccount, type AdminAliyunRegion, type AdminUser, type CloudResourceMapping } from "../../api";
import { Confirm, EmptyState, Field, Modal, ModalSave, PageHeader, Panel, ResourceTable, StatusBadge, Tabs } from "../../shared";

type AccountForm = { name: string; account_id: string; region_id: string; access_key_id: string; access_key_secret: string; security_token: string; default_image_id: string; default_vswitch_id: string; default_security_group_id: string; status: string };
const emptyForm: AccountForm = { name: "", account_id: "", region_id: "cn-chongqing", access_key_id: "", access_key_secret: "", security_token: "", default_image_id: "", default_vswitch_id: "", default_security_group_id: "", status: "active" };

export function AdminAlibabaAccountsPage() {
  const [accounts, setAccounts] = useState<AdminAlibabaAccount[]>([]);
  const [regions, setRegions] = useState<AdminAliyunRegion[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [resources, setResources] = useState<CloudResourceMapping[]>([]);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("账号列表");
  const [edit, setEdit] = useState<AdminAlibabaAccount | "new" | null>(null);
  const [binding, setBinding] = useState<AdminAlibabaAccount | null>(null);
  const [remove, setRemove] = useState<AdminAlibabaAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const load = async () => { setLoading(true); setError(""); try { const [nextAccounts, nextUsers, nextResources, nextRegions] = await Promise.all([api.adminAlibabaAccounts(), api.adminUsers(), api.adminProviderResources(), api.adminAliyunRegions()]); setAccounts(nextAccounts); setUsers(nextUsers); setResources(nextResources); setRegions(nextRegions); } catch (err) { setError(err instanceof Error ? err.message : "系统管理数据加载失败"); } finally { setLoading(false); } };
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, []);
  const filtered = useMemo(() => accounts.filter((item) => `${item.name}${item.account_id}${item.region_id}${item.status}`.toLowerCase().includes(query.toLowerCase())), [accounts, query]);
  return <>
    <PageHeader eyebrow="SYSTEM ADMINISTRATION" title="阿里云账号" description="维护平台统一计费使用的云账号，并将租户资源绑定到指定账号。凭据只写入后台，不会回显。" actions={<><button className="button secondary" onClick={() => void load()} disabled={loading}><RefreshCw size={15} />刷新</button><button className="button primary" onClick={() => setEdit("new")}><Plus size={16} />新增账号</button></>} />
    {error && <div className="security-note"><ShieldOff size={18} /><p>{error}</p></div>}
    <Panel><Tabs items={["账号列表", "资源关联"]} value={tab} onChange={setTab} />{tab === "账号列表" ? <><div className="filters"><label className="search"><Search size={16} /><input placeholder="搜索账号名称、账号 ID 或地域" value={query} onChange={(event) => setQuery(event.target.value)} /></label><button className="button secondary" onClick={() => setQuery("")}>重置</button></div><ResourceTable heads={["账号", "地域", "凭据", "绑定用户", "关联资源", "状态", "操作"]}>{filtered.map((account) => <tr key={account.id}><td><strong>{account.name}</strong><small>{account.id}{account.account_id ? ` · ${account.account_id}` : ""}</small></td><td>{account.region_id}</td><td>{account.has_credentials ? <StatusBadge value="active" /> : <StatusBadge value="error" />}</td><td>{account.bound_user_count}</td><td>{account.resource_count}</td><td><StatusBadge value={account.status} /></td><td><div className="row-actions"><button title="编辑" onClick={() => setEdit(account)}><Edit3 size={15} /></button><button title="绑定用户" onClick={() => setBinding(account)}><Link2 size={15} /></button><button title="停用" disabled={account.status === "disabled"} onClick={() => setRemove(account)}><ShieldOff size={15} /></button></div></td></tr>)}</ResourceTable>{filtered.length === 0 && <EmptyState title={query ? "没有匹配账号" : "暂无阿里云账号"} description="新增账号后即可分配给租户和资源。" />}</> : <ResourceAssociation resources={resources} accounts={accounts} onSaved={load} />}</Panel>
    {edit && <AccountModal value={edit} regions={regions} onClose={() => setEdit(null)} onSaved={async () => { setEdit(null); await load(); }} />}
    {binding && <BindingModal account={binding} users={users} onClose={() => setBinding(null)} onSaved={async () => { setBinding(null); await load(); }} />}
    {remove && <Confirm title="停用阿里云账号" message={`停用“${remove.name}”后，新资源不会再使用此账号，已有资源映射仍会保留。`} confirmText="确认停用" onClose={() => setRemove(null)} onConfirm={async () => { await api.disableAdminAlibabaAccount(remove.id); setRemove(null); await load(); }} />}
  </>;
}

function AccountModal({ value, regions, onClose, onSaved }: { value: AdminAlibabaAccount | "new"; regions: AdminAliyunRegion[]; onClose: () => void; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState<AccountForm>(() => value === "new" ? emptyForm : {
    name: value.name, account_id: value.account_id, region_id: value.region_id, access_key_id: value.access_key_id,
    access_key_secret: "", security_token: "", default_image_id: value.default_image_id, default_vswitch_id: value.default_vswitch_id,
    default_security_group_id: value.default_security_group_id, status: value.status,
  });
  const [error, setError] = useState("");
  const set = (key: keyof AccountForm, next: string) => setForm((current) => ({ ...current, [key]: next }));
  const catalogRegions = regions.filter((region) => region.status === "active").map((region) => [region.code, region.name] as const);
  const regionValues = catalogRegions.some(([code]) => code === form.region_id) ? catalogRegions : [[form.region_id, "当前账号地域"] as const, ...catalogRegions];
  return <Modal wide title={value === "new" ? "新增阿里云账号" : "编辑阿里云账号"} description="使用 AccessKey 连接阿里云，Endpoint 使用 SDK 默认地址。编辑时 Secret 留空表示保持原值。" onClose={onClose}><div className="form-grid"><Field label="账号名称" required><input value={form.name} onChange={(e) => set("name", e.target.value)} /></Field><Field label="地域 ID" required><select value={form.region_id} onChange={(e) => set("region_id", e.target.value)}>{regionValues.map(([code, name]) => <option key={code} value={code}>{name}（{code}）</option>)}</select></Field><Field label="阿里云账号 ID"><input value={form.account_id} onChange={(e) => set("account_id", e.target.value)} /></Field><Field label="AccessKey ID" required><input value={form.access_key_id} onChange={(e) => set("access_key_id", e.target.value)} /></Field><Field label="AccessKey Secret" required={value === "new"}><input type="password" value={form.access_key_secret} onChange={(e) => set("access_key_secret", e.target.value)} /></Field><Field label="安全令牌（可选）"><input type="password" value={form.security_token} onChange={(e) => set("security_token", e.target.value)} /></Field><Field label="状态"><select value={form.status} onChange={(e) => set("status", e.target.value)}><option value="active">启用</option><option value="disabled">停用</option></select></Field></div>{error && <p className="form-error">{error}</p>}<ModalSave disabled={!form.name.trim() || !form.region_id.trim() || !form.access_key_id.trim() || (value === "new" && !form.access_key_secret.trim())} onClose={onClose} onSave={async () => { try { setError(""); if (value === "new") await api.createAdminAlibabaAccount(form); else await api.updateAdminAlibabaAccount(value.id, form); await onSaved(); } catch (err) { setError(err instanceof Error ? err.message : "保存失败"); } }} /></Modal>;
}

function BindingModal({ account, users, onClose, onSaved }: { account: AdminAlibabaAccount; users: AdminUser[]; onClose: () => void; onSaved: () => Promise<void> }) {
  const [bound, setBound] = useState<AdminAccountUser[]>([]); const [userId, setUserId] = useState(""); const [isDefault, setIsDefault] = useState(false); const [error, setError] = useState("");
  useEffect(() => { void api.adminAccountUsers(account.id).then(setBound).catch((err) => setError(err instanceof Error ? err.message : "绑定关系加载失败")); }, [account.id]);
  return <Modal title={`绑定用户 · ${account.name}`} description="绑定后该租户创建的资源可归属此账号。" onClose={onClose}><div className="form-grid"><Field label="选择用户" required><select value={userId} onChange={(e) => setUserId(e.target.value)}><option value="">请选择</option>{users.filter((user) => !bound.some((item) => item.user_id === user.id)).map((user) => <option key={user.id} value={user.id}>{user.display_name} · {user.email}</option>)}</select></Field><label className="check-row"><input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} /><span>设为该用户默认账号</span></label></div><div className="simple-list">{bound.map((item) => <div key={item.user_id}><span><b>{item.display_name}</b><small>{item.email}{item.is_default ? " · 默认账号" : ""}</small></span><button className="text-button" onClick={async () => { await api.unbindAdminAccountUser(account.id, item.user_id); setBound((current) => current.filter((entry) => entry.user_id !== item.user_id)); }}>解绑</button></div>)}</div>{error && <p className="form-error">{error}</p>}<ModalSave disabled={!userId} onClose={onClose} onSave={async () => { await api.bindAdminAccountUser(account.id, userId, isDefault); await onSaved(); }} /></Modal>;
}

function ResourceAssociation({ resources, accounts, onSaved }: { resources: CloudResourceMapping[]; accounts: AdminAlibabaAccount[]; onSaved: () => Promise<void> }) {
  const [query, setQuery] = useState(""); const [saving, setSaving] = useState(""); const visible = resources.filter((item) => `${item.public_id}${item.provider_resource_id}${item.resource_type}${item.provider_account_id}`.toLowerCase().includes(query.toLowerCase()));
  return <><div className="filters"><label className="search"><Search size={16} /><input placeholder="搜索资源 ID、类型或账号" value={query} onChange={(e) => setQuery(e.target.value)} /></label><button className="button secondary" onClick={() => setQuery("")}>重置</button></div><ResourceTable heads={["平台资源", "类型", "云厂商资源 ID", "地域", "账号关联", "状态"]}>{visible.map((resource) => <tr key={`${resource.resource_type}-${resource.public_id}`}><td><strong>{resource.public_id}</strong><small>{resource.provider_name}</small></td><td>{resource.resource_type}</td><td><code>{resource.provider_resource_id || "待同步"}</code></td><td>{resource.region_id || "-"}</td><td><select value={resource.provider_account_id ?? ""} disabled={saving === resource.public_id} onChange={async (e) => { setSaving(resource.public_id); try { await api.associateAdminResource(resource.resource_type, resource.public_id, e.target.value); await onSaved(); } finally { setSaving(""); } }}><option value="">未关联</option>{accounts.filter((account) => account.status === "active").map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></td><td><StatusBadge value={resource.status} /></td></tr>)}</ResourceTable>{visible.length === 0 && <EmptyState title="暂无可关联资源" description="资源创建或同步后会出现在这里。" />}</>;
}
