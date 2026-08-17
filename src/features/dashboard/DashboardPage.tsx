import { useNavigate } from "react-router-dom";
import {
  Activity, ChevronRight, Database, Globe2, HardDrive, KeyRound,
  Network, Plus, Server, ShieldCheck,
} from "lucide-react";
import { useConsoleStore } from "../../store";
import { formatShortDateTime as fmt, Metric, PageHeader, Panel, StatusBadge } from "../../shared";

export function DashboardPage() {
  const { state } = useConsoleStore(); const navigate = useNavigate();
  const running = state.instances.filter((i) => i.status === "running").length; const openAlerts = state.alertEvents.filter((a) => a.status === "未恢复").length;
  return <><PageHeader title="控制台首页" description="集中查看资源运行状态、费用和待处理事项。" actions={<button className="button primary" onClick={() => navigate("/instances/new")}><Plus size={16} />创建云服务器</button>} />
    <div className="metrics-grid"><Metric label="资源总数" value={state.instances.length + state.disks.length + state.publicIps.length} detail="实例、云盘与公网 IP" /><Metric label="运行实例" value={running} detail={`共 ${state.instances.length} 台实例`} tone="green" /><Metric label="账户余额" value={`${state.balance.toLocaleString()} USDT`} detail="当前可用余额" tone="orange" /><Metric label="告警数量" value={openAlerts} detail="当前未恢复告警" tone={openAlerts ? "red" : "green"} /></div>
    <div className="dashboard-grid"><div className="dashboard-main">
      <Panel title="最近访问的产品"><div className="quick-products">{[{ n: "云服务器", p: "/instances", i: Server }, { n: "云盘", p: "/storage", i: Database }, { n: "VPC", p: "/network", i: Network }, { n: "云监控", p: "/monitoring", i: Activity }].map(({ n, p, i: Icon }) => <button key={n} onClick={() => navigate(p)}><Icon size={19} /><span>{n}</span><ChevronRight size={14} /></button>)}</div></Panel>
      <Panel title="我的资源概览" action={<button className="text-button" onClick={() => navigate("/resources")}>查看全部</button>}><div className="resource-overview"><div><Server size={20} /><span>云服务器</span><b>{state.instances.length}</b><small>{running} 台运行中</small></div><div><HardDrive size={20} /><span>云盘</span><b>{state.disks.length}</b><small>{state.disks.filter((d) => d.status === "available").length} 块可挂载</small></div><div><Globe2 size={20} /><span>公网 IP</span><b>{state.publicIps.length}</b><small>{state.publicIps.filter((i) => i.status === "bound").length} 个已绑定</small></div><div><ShieldCheck size={20} /><span>安全组</span><b>{state.securityGroups.length}</b><small>规则运行正常</small></div></div></Panel>
      <Panel title="最近订单" action={<button className="text-button" onClick={() => navigate("/billing")}>订单中心</button>}><div className="simple-list">{state.orders.slice(0, 4).map((order) => <button key={order.id} onClick={() => navigate("/billing")}><div><strong>{order.resourceName}</strong><small>{order.id}</small></div><StatusBadge value={order.status} /><b>{order.amount.toFixed(2)} USDT</b><time>{fmt(order.createdAt)}</time></button>)}</div></Panel>
    </div><aside className="dashboard-rail"><Panel title="快捷操作"><div className="stack-actions"><button onClick={() => navigate("/instances/new")}><Plus size={17} />创建云服务器</button><button onClick={() => navigate("/network")}><Network size={17} />创建 VPC</button><button onClick={() => navigate("/api-keys")}><KeyRound size={17} />创建 API Key</button></div></Panel><Panel title="系统消息"><div className="messages">{state.notifications.map((notice) => <p key={notice.id}><i />{notice.title}<time>{fmt(notice.createdAt)}</time></p>)}</div></Panel></aside></div></>;
}
