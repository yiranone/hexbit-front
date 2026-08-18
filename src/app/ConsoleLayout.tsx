import { useEffect, useState } from "react";
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import {
  Activity, Bell, Boxes, ChevronDown, ChevronRight, CloudCog,
  Globe2, HardDrive, HelpCircle, KeyRound, LayoutDashboard,
  Menu, Network, ReceiptText, RefreshCw,
  Server, Users, WalletCards, X,
  ShieldCheck,
  UserCog,
  Database,
} from "lucide-react";
import { id, useConsoleStore } from "../store";
import { Confirm, Field, Modal } from "../shared";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { ComputePage, CreateInstancePage, InstanceDetailPage, InstancesPage } from "../features/ecs";
import { ApiKeysPage } from "../features/api-keys/ApiKeysPage";
import { BillingPage } from "../features/billing/BillingPage";
import { UsersPage } from "../features/iam/UsersPage";
import { MonitoringPage } from "../features/monitoring/MonitoringPage";
import { NetworkPage } from "../features/network/NetworkPage";
import { ResourcesPage } from "../features/resources/ResourcesPage";
import { StoragePage } from "../features/storage/StoragePage";
import { HelpPage } from "../features/support/HelpPage";
import { AdminAlibabaAccountsPage } from "../features/admin/AdminAlibabaAccountsPage";
import { AdminUsersPage } from "../features/admin/AdminUsersPage";
import { AdminAliyunCatalogPage } from "../features/admin/AdminAliyunCatalogPage";
import { AdminFinancePage } from "../features/admin/AdminFinancePage";
import "../styles/index.css";

const menu = [
  { to: "/", label: "首页", icon: LayoutDashboard },
  { to: "/compute", label: "云服务器", icon: CloudCog },
  { to: "/instances", label: "实例管理", icon: Server },
  { to: "/network", label: "网络与 VPC", icon: Network },
  { to: "/storage", label: "存储管理", icon: HardDrive },
  { to: "/resources", label: "资源中心", icon: Boxes },
  { to: "/monitoring", label: "云监控", icon: Activity },
  { to: "/billing", label: "用量与账单", icon: ReceiptText },
  { to: "/users", label: "用户与权限", icon: Users },
  { to: "/api-keys", label: "API 密钥", icon: KeyRound },
  { to: "/help", label: "帮助中心", icon: HelpCircle },
];
const routeNames: Record<string, string> = { compute: "云服务器", instances: "实例管理", network: "网络与 VPC", storage: "存储管理", resources: "资源中心", monitoring: "云监控", billing: "用量与账单", users: "用户与权限", "api-keys": "API 密钥", help: "帮助中心", admin: "系统管理", "provider-accounts": "阿里云账号", catalog: "云基础数据", finance: "用户资金与订单", new: "创建云服务器" };

export function ConsoleLayout() {
  const { state, user, toast, reset, ready, error, loading, reload, mutate } = useConsoleStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 960);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  useEffect(() => { const resize = () => { if (window.innerWidth < 960) { setCollapsed(true); setMobileOpen(false); } }; window.addEventListener("resize", resize); return () => window.removeEventListener("resize", resize); }, []);
  const crumbs = location.pathname.split("/").filter(Boolean).map((part) => routeNames[part] ?? part);
  const unread = state.notifications.filter((notice) => !notice.read).length;
  if (!ready) return <div className="database-gate"><img src="/hexbit-mark.svg" alt="" /><h1>{error ? "数据库连接失败" : "正在加载控制台数据"}</h1><p>{error || "正在验证账号并从 MySQL 读取最新资源状态。"}</p>{error && <button className="button primary" disabled={loading} onClick={() => void reload()}><RefreshCw size={16} />重新连接</button>}</div>;
  return <div className={`console-shell ${collapsed ? "collapsed" : ""}`}>
    <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
      <div className="brand"><img src="/hexbit-mark.svg" alt="" /><strong>HEXBIT</strong><button className="icon-button mobile-close" onClick={() => setMobileOpen(false)} aria-label="关闭导航"><X size={18} /></button></div>
      <nav>{menu.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === "/"} title={collapsed ? label : undefined} onClick={() => setMobileOpen(false)}><Icon size={18} /><span>{label}</span><ChevronRight size={14} /></NavLink>)}{user?.role === "admin" && <><div className="nav-section-title"><ShieldCheck size={15} /><span>系统管理</span></div><NavLink to="/admin/provider-accounts" title={collapsed ? "阿里云账号" : undefined} onClick={() => setMobileOpen(false)}><CloudCog size={18} /><span>阿里云账号</span><ChevronRight size={14} /></NavLink><NavLink to="/admin/users" title={collapsed ? "用户管理" : undefined} onClick={() => setMobileOpen(false)}><UserCog size={18} /><span>用户管理</span><ChevronRight size={14} /></NavLink><NavLink to="/admin/catalog" title={collapsed ? "云基础数据" : undefined} onClick={() => setMobileOpen(false)}><Database size={18} /><span>云基础数据</span><ChevronRight size={14} /></NavLink><NavLink to="/admin/finance" title={collapsed ? "用户资金与订单" : undefined} onClick={() => setMobileOpen(false)}><WalletCards size={18} /><span>用户资金与订单</span><ChevronRight size={14} /></NavLink></>}</nav>
      <div className="sidebar-foot"><button onClick={() => setResetOpen(true)}><RefreshCw size={17} /><span>恢复初始数据</span></button></div>
    </aside>
    {mobileOpen && <button className="sidebar-scrim" aria-label="关闭导航" onClick={() => setMobileOpen(false)} />}
    <div className="workspace">
      <header className="topbar">
        <button className="icon-button desktop-menu" onClick={() => setCollapsed((value) => !value)} aria-label="折叠菜单"><Menu size={19} /></button>
        <button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="打开菜单"><Menu size={19} /></button>
        <div className="popover-wrap"><button className="region-button" onClick={() => setRegionOpen((v) => !v)}><Globe2 size={16} /><span>{state.selectedRegion}</span><ChevronDown size={14} /></button>{regionOpen && <div className="popover region-menu">{["中国重庆二期", "新加坡一区"].map((region) => <button key={region} className={state.selectedRegion === region ? "active" : ""} onClick={async () => { const saved = await mutate((s) => ({ ...s, selectedRegion: region }), `默认区域已切换为 ${region}`); if (saved) setRegionOpen(false); }}>{region} {state.selectedRegion === region && <span>当前</span>}</button>)}</div>}</div>
        <nav className="top-links"><button onClick={() => navigate("/billing")}>费用</button><button onClick={() => navigate("/resources")}>资源</button><button onClick={() => navigate("/users")}>用户</button><button onClick={() => navigate("/help")}>文档</button></nav>
        <div className="top-actions">
          <button className="wallet-button" onClick={() => setRechargeOpen(true)}><WalletCards size={16} /><span>{state.balance.toLocaleString("zh-CN", { minimumFractionDigits: 2 })} USDT</span></button>
          <div className="popover-wrap"><button className="icon-button badge-button" onClick={() => setNoticeOpen((v) => !v)} aria-label="通知"><Bell size={18} />{unread > 0 && <i>{unread}</i>}</button>{noticeOpen && <div className="popover notification-popover"><header><b>通知</b><button disabled={unread === 0} onClick={() => mutate((s) => ({ ...s, notifications: s.notifications.map((notice) => ({ ...notice, read: true })) }), "所有通知已标记为已读")}>全部已读</button></header>{state.notifications.map((notice) => <p key={notice.id}><span className={`notice-dot ${notice.read ? "" : "warning"}`} />{notice.title}<small>{notice.body}</small></p>)}</div>}</div>
          <div className="popover-wrap"><button className="profile-button" onClick={() => setProfileOpen((v) => !v)}>AD<ChevronDown size={13} /></button>{profileOpen && <div className="popover profile-menu"><strong>admin</strong><span>所有者 · 全部资源</span><button onClick={() => { navigate("/users"); setProfileOpen(false); }}>账户与权限</button><button onClick={() => { setResetOpen(true); setProfileOpen(false); }}>恢复初始数据</button></div>}</div>
        </div>
      </header>
      <div className="breadcrumb"><Link to="/">控制台</Link>{crumbs.map((item, index) => <span key={`${item}-${index}`}><ChevronRight size={13} />{item}</span>)}</div>
      <main className="content"><Routes>
        <Route path="/" element={<DashboardPage />} /><Route path="/compute" element={<ComputePage />} /><Route path="/instances/new" element={<CreateInstancePage />} />
        <Route path="/instances" element={<InstancesPage />} /><Route path="/instances/:instanceId" element={<InstanceDetailPage />} />
        <Route path="/network" element={<NetworkPage />} /><Route path="/storage" element={<StoragePage />} /><Route path="/resources" element={<ResourcesPage />} />
        <Route path="/monitoring" element={<MonitoringPage />} /><Route path="/billing" element={<BillingPage onRecharge={() => setRechargeOpen(true)} />} />
        <Route path="/users" element={<UsersPage />} /><Route path="/api-keys" element={<ApiKeysPage />} /><Route path="/help" element={<HelpPage />} />
        <Route path="/admin/provider-accounts" element={<AdminAlibabaAccountsPage />} /><Route path="/admin/users" element={<AdminUsersPage />} /><Route path="/admin/catalog" element={<AdminAliyunCatalogPage />} /><Route path="/admin/finance" element={<AdminFinancePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes></main>
    </div>
    {toast && <div className="toast"><span>✓</span>{toast}</div>}
    {rechargeOpen && <RechargeModal onClose={() => setRechargeOpen(false)} />}
    {resetOpen && <Confirm title="恢复初始数据" message="该操作会覆盖当前账号保存在 MySQL 中的实例、订单、用户、网络、存储、密钥、告警和账单数据，且无法撤销。" confirmText="确认覆盖数据库" onClose={() => setResetOpen(false)} onConfirm={async () => { const saved = await reset(); if (saved) setResetOpen(false); }} />}
  </div>;
}

function RechargeModal({ onClose }: { onClose: () => void }) {
  const { mutate, loading } = useConsoleStore(); const [amount, setAmount] = useState(1000);
  const submit = async () => { if (amount <= 0) return; const saved = await mutate((s) => ({ ...s, balance: s.balance + amount, billing: [{ id: id("bill"), type: "recharge", product: "账户充值", amount, createdAt: new Date().toISOString() }, ...s.billing] }), `充值 ${amount.toFixed(2)} USDT 成功`); if (saved) onClose(); };
  return <Modal title="账户充值" description="充值记录和账户余额将在 MySQL 提交成功后更新。" onClose={onClose}><div className="form-grid single"><Field label="充值金额" required><input type="number" min="1" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></Field><div className="quick-amounts">{[100, 500, 1000, 5000].map((item) => <button key={item} className={amount === item ? "active" : ""} onClick={() => setAmount(item)}>{item} USDT</button>)}</div></div><div className="modal-actions"><button className="button secondary" onClick={onClose}>取消</button><button className="button primary" disabled={loading || amount <= 0} onClick={submit}>{loading ? "处理中" : "确认充值"}</button></div></Modal>;
}
