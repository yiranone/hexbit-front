"use client";

import { useMemo, useState } from "react";
import { CreateServerPage, type ServerCreateRequest } from "./create-server";
import {
  Activity,
  Bell,
  BookOpen,
  Boxes,
  CalendarClock,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clipboard,
  CloudCog,
  Code2,
  Download,
  Edit3,
  Filter,
  Gauge,
  HardDrive,
  KeyRound,
  Layers3,
  MoreHorizontal,
  Network,
  Plus,
  Power,
  ReceiptText,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Tag,
  TriangleAlert,
  Trash2,
  X,
  Zap,
} from "lucide-react";

type ConsoleSectionsProps = {
  section: string;
  balance: number;
  onRent: () => void;
  onCharge: () => void;
  onNotice: (message: string) => void;
  createServerRequest?: boolean;
  onCreateServerHandled?: () => void;
  instances: Instance[];
  setInstances: React.Dispatch<React.SetStateAction<Instance[]>>;
  onServerCreated: (request: ServerCreateRequest) => void;
};

export type Instance = {
  id: string;
  name: string;
  status: "运行中" | "已停止";
  region: string;
  zone: string;
  spec: string;
  disk: string;
  os: string;
  publicIp: string;
  privateIp: string;
  billing: string;
  price: string;
  duration?: number;
  autoRenew?: boolean;
  vpc?: string;
  resourceGroup?: string;
};

const modelRows = [
  { mark: "Q", name: "Qwen3-235B-A22B", provider: "Qwen", type: "文本生成", context: "131K", input: "$0.18", output: "$0.72", latency: "412 ms", status: "稳定" },
  { mark: "D", name: "DeepSeek-V3.1", provider: "DeepSeek", type: "推理增强", context: "128K", input: "$0.14", output: "$0.56", latency: "536 ms", status: "稳定" },
  { mark: "G", name: "GLM-4.7", provider: "Zhipu AI", type: "工具调用", context: "128K", input: "$0.22", output: "$0.88", latency: "468 ms", status: "稳定" },
  { mark: "K", name: "Kimi-K2-Instruct", provider: "Moonshot", type: "文本生成", context: "256K", input: "$0.20", output: "$0.80", latency: "621 ms", status: "繁忙" },
];

const gpuRows = [
  { name: "NVIDIA H100 SXM", vram: "80 GB HBM3", compute: "26 vCPU · 200 GB", region: "Singapore · A", stock: 6, ondemand: "$2.596", monthly: "$1.97", saving: "省 24%" },
  { name: "NVIDIA A100 SXM", vram: "80 GB HBM2e", compute: "24 vCPU · 180 GB", region: "Hong Kong · B", stock: 11, ondemand: "$0.960", monthly: "$0.78", saving: "省 19%" },
  { name: "NVIDIA RTX 4090", vram: "24 GB GDDR6X", compute: "16 vCPU · 64 GB", region: "Singapore · C", stock: 18, ondemand: "$0.420", monthly: "$0.34", saving: "省 20%" },
  { name: "NVIDIA L40S", vram: "48 GB GDDR6", compute: "20 vCPU · 96 GB", region: "Tokyo · A", stock: 4, ondemand: "$0.720", monthly: "$0.59", saving: "省 18%" },
];

export const initialInstances: Instance[] = [
  { id: "ins-sg-7F28", name: "prod-inference-01", status: "运行中", region: "Singapore", zone: "ap-sg-1a", spec: "RTX 4090 · 16C 64G", disk: "NVMe 480 GiB", os: "Ubuntu 24.04", publicIp: "103.28.74.16", privateIp: "10.14.2.8", billing: "按量计费", price: "$0.420/h" },
  { id: "ins-hk-2A91", name: "qwen-finetune", status: "运行中", region: "Hong Kong", zone: "ap-hk-1b", spec: "A100 80G · 24C 180G", disk: "SSD 1.2 TiB", os: "PyTorch 2.5", publicIp: "45.124.68.31", privateIp: "10.21.4.12", billing: "包月", price: "$568.00/mo" },
  { id: "ins-tk-9C04", name: "dev-notebook", status: "已停止", region: "Tokyo", zone: "ap-tk-1a", spec: "L40S 48G · 20C 96G", disk: "SSD 320 GiB", os: "Ubuntu 22.04", publicIp: "未绑定", privateIp: "10.31.8.6", billing: "按量计费", price: "$0.720/h" },
];

const initialKeys = [
  { id: "key_01", name: "生产环境", token: "sk-hexbit-prod-••••••12", permission: "全部模型", limit: "$500 / 月", used: "61%", created: "2026-07-18", lastUsed: "2 分钟前", status: "活跃" },
  { id: "key_02", name: "合作伙伴 Acme", token: "sk-hexbit-acme-••••••89", permission: "仅文本模型", limit: "$100 / 月", used: "24%", created: "2026-07-29", lastUsed: "3 小时前", status: "活跃" },
  { id: "key_03", name: "测试环境", token: "sk-hexbit-test-••••••44", permission: "全部模型", limit: "$10 / 月", used: "100%", created: "2026-08-02", lastUsed: "昨天", status: "已暂停" },
];

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ConsoleSections(props: ConsoleSectionsProps) {
  if (props.section === "模型 API") return <ModelsPage {...props} />;
  if (props.section === "GPU 服务器") return <GpuPage {...props} />;
  if (props.section === "实例管理") return <InstancesPage {...props} />;
  if (props.section === "资源中心") return <ResourceCenterPage {...props} />;
  if (props.section === "云监控") return <MonitorPage {...props} />;
  if (props.section === "用量与账单") return <BillingPage {...props} />;
  if (props.section === "用户与权限") return <UsersPage onNotice={props.onNotice} />;
  if (props.section === "账号中心") return <AccountCenterPage onNotice={props.onNotice} />;
  if (props.section === "消息中心") return <MessageCenterPage />;
  if (props.section === "帮助中心") return <HelpCenterPage />;
  return <KeysPage {...props} />;
}

function PageHeader({ eyebrow, title, description, action, onAction }: { eyebrow: string; title: string; description: string; action: string; onAction: () => void }) {
  return <div className="console-page-head"><div><span>{eyebrow}</span><h2>{title}</h2><p>{description}</p></div><button className="primary" onClick={onAction}><Plus size={16} />{action}</button></div>;
}

function Metrics({ items }: { items: Array<{ label: string; value: string; note: string; icon: React.ReactNode; tone?: string }> }) {
  return <div className="console-metrics">{items.map((item) => <article key={item.label}><div className={`metric-icon ${item.tone ?? ""}`}>{item.icon}</div><div><span>{item.label}</span><b>{item.value}</b><small>{item.note}</small></div></article>)}</div>;
}

function FilterMenu({ icon, value, options, onChange }: { icon: React.ReactNode; value: string; options: string[]; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  return <div className={`filter-menu ${open ? "open" : ""}`} onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <button className="filter-menu-trigger" type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
      {icon}<span>{value}</span><ChevronDown size={14} />
    </button>
    {open && <div className="filter-menu-popover" role="listbox" aria-label={value}>
      {options.map((option) => <button key={option} type="button" role="option" aria-selected={value === option} className={value === option ? "selected" : ""} onClick={() => { onChange(option); setOpen(false); }}>
        <span>{option}</span>{value === option && <Check size={14} />}
      </button>)}
    </div>}
  </div>;
}

function ModelsPage({ onNotice }: ConsoleSectionsProps) {
  const [category, setCategory] = useState("全部模型");
  const [search, setSearch] = useState("");
  const [usageDetails, setUsageDetails] = useState(false);
  const filtered = modelRows.filter((model) => (category === "全部模型" || model.type === category) && model.name.toLowerCase().includes(search.toLowerCase()));
  return <div className="console-page">
    <PageHeader eyebrow="AI STUDIO / MODEL API" title="模型 API" description="通过统一的 OpenAI 兼容端点调用模型，按实际 Token 用量结算。" action="创建 API Key" onAction={() => onNotice("已打开 API Key 创建流程")} />
    <Metrics items={[
      { label: "本月 Token", value: "24.8M", note: "较上月 +12.4%", icon: <Activity size={18} /> },
      { label: "本月费用", value: "$18.62", note: "预算使用 37%", icon: <CircleDollarSign size={18} />, tone: "green" },
      { label: "成功率", value: "99.92%", note: "过去 30 天", icon: <Gauge size={18} />, tone: "orange" },
      { label: "可用模型", value: "12", note: "4 家模型提供商", icon: <Code2 size={18} />, tone: "purple" },
    ]} />
    <div className="console-split model-overview"><section className="panel model-usage"><div className="panel-title"><div><h3>用量趋势</h3><p>过去 7 天 · 百万 Token</p></div><button className="text-button" onClick={() => setUsageDetails((open) => !open)}>{usageDetails ? "收起明细" : "查看明细"}</button></div><div className="bar-chart">{[42, 58, 48, 72, 66, 84, 61].map((height, index) => <div key={index}><i style={{ height: `${height}%` }} /><span>{["五", "六", "日", "一", "二", "三", "四"][index]}</span></div>)}</div></section><section className="panel endpoint-card"><div className="panel-title"><div><h3>API 接入</h3><p>OpenAI SDK 无缝迁移</p></div><button className="icon-button" title="复制端点" onClick={() => { navigator.clipboard?.writeText("https://api.hexbit.ai/v1"); onNotice("API 端点已复制"); }}><Clipboard size={16} /></button></div><code>https://api.hexbit.ai/v1</code><div className="endpoint-meta"><span><Check size={14} />兼容 Chat Completions</span><span><ShieldCheck size={14} />TLS 加密</span></div><button className="secondary compact" onClick={() => setUsageDetails(true)}>查看接入文档</button></section></div>
    {usageDetails && <section className="panel model-detail-panel"><div className="panel-title"><div><h3>API 用量与接入明细</h3><p>最近 7 天 · OpenAI 兼容接口</p></div><button className="outline-button" onClick={() => downloadCsv("model-api-usage.csv", [["日期", "请求数", "Token", "费用"], ["2026-08-08", 18406, "4.2M", "$3.18"], ["2026-08-07", 16282, "3.8M", "$2.94"]])}><Download size={14} />导出</button></div><div className="model-detail-grid"><div><span>Base URL</span><code>https://api.hexbit.ai/v1</code></div><div><span>鉴权方式</span><code>Authorization: Bearer $API_KEY</code></div><div><span>今日请求</span><b>18,406</b></div><div><span>今日费用</span><b>$3.18</b></div></div></section>}
    <section className="panel table-panel"><div className="table-toolbar"><div><h3>模型目录</h3><span>{filtered.length} 个可用模型</span></div><div className="segmented">{["全部模型", "文本生成", "推理增强", "工具调用"].map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div><label className="search-box"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索模型" /></label></div><div className="responsive-table"><div className="table-row table-head models-table"><span>模型</span><span>类型</span><span>上下文</span><span>输入 / 1M</span><span>输出 / 1M</span><span>平均延迟</span><span>状态</span><span /></div>{filtered.map((model) => <div className="table-row models-table" key={model.name}><div className="model-name"><b>{model.mark}</b><span><strong>{model.name}</strong><small>{model.provider}</small></span></div><span>{model.type}</span><span>{model.context}</span><span>{model.input}</span><span>{model.output}</span><span>{model.latency}</span><span className={`status-label ${model.status === "稳定" ? "success" : "warning"}`}><i />{model.status}</span><button className="outline-button" onClick={() => onNotice(`已选择 ${model.name}`)}>调用</button></div>)}</div></section>
  </div>;
}

function GpuPage({ onNotice, createServerRequest, onCreateServerHandled, onServerCreated }: ConsoleSectionsProps) {
  const [billing, setBilling] = useState("按量计费");
  const [region, setRegion] = useState("全部区域");
  const [mode, setMode] = useState(createServerRequest ? "创建服务器" : "GPU 资源池");
  const [gpuFilterOpen, setGpuFilterOpen] = useState(false);
  const [gpuFamily, setGpuFamily] = useState("全部 GPU");
  const [minimumStock, setMinimumStock] = useState("不限库存");
  const [taskRange, setTaskRange] = useState("近 30 天");
  const [taskQuery, setTaskQuery] = useState("");
  const tasks = [
    ["qwen-finetune-v4", "train-cluster-01", "PyTorch", "A100 80G x 4", "4", "高", "运行中"],
    ["embedding-batch-0821", "inference-pool", "Ray", "L40S 48G x 2", "8", "中", "排队中"],
    ["vision-eval", "dev-cluster", "PyTorch", "RTX 4090 x 1", "1", "普通", "已完成"],
  ];
  if (mode === "创建服务器") return <CreateServerPage onBack={() => { setMode("GPU 资源池"); onCreateServerHandled?.(); }} onNotice={onNotice} onSubmit={onServerCreated} />;
  return <div className="console-page">
    <PageHeader eyebrow="COMPUTE / GPU MARKET" title="GPU 服务器" description="按工作负载选择 GPU，支持虚拟机、裸金属和竞价实例。" action="创建服务器" onAction={() => setMode("创建服务器")} />
    <div className="module-tabs">{["GPU 资源池", "算力任务"].map((item) => <button key={item} className={mode === item ? "active" : ""} onClick={() => setMode(item)}>{item}</button>)}</div>
    {mode === "GPU 资源池" ? <>
      <div className="availability-strip"><span><Zap size={18} />实时库存</span><div><b>39</b> 张 GPU 可立即部署</div><small>库存更新于 12 秒前</small><button className="icon-button" title="刷新库存" onClick={() => onNotice("库存已刷新")}><RefreshCw size={15} /></button></div>
      <section className="panel table-panel"><div className="table-toolbar gpu-toolbar"><div className="segmented">{["按量计费", "包月", "竞价实例"].map((item) => <button key={item} className={billing === item ? "active" : ""} onClick={() => setBilling(item)}>{item}</button>)}</div><div className="toolbar-actions"><label className="select-control"><Network size={15} /><select value={region} onChange={(event) => setRegion(event.target.value)}><option>全部区域</option><option>Singapore</option><option>Hong Kong</option><option>Tokyo</option></select><ChevronDown size={14} /></label><button className="outline-button" onClick={() => setGpuFilterOpen((open) => !open)}><Filter size={14} />{gpuFilterOpen ? "收起筛选" : "更多筛选"}</button></div></div>{gpuFilterOpen && <div className="advanced-filter-strip"><label>GPU 型号<select value={gpuFamily} onChange={(event) => setGpuFamily(event.target.value)}><option>全部 GPU</option><option>H100</option><option>A100</option><option>RTX 4090</option><option>L40S</option></select></label><label>最低库存<select value={minimumStock} onChange={(event) => setMinimumStock(event.target.value)}><option>不限库存</option><option>至少 5 张</option><option>至少 10 张</option></select></label><button className="text-button" onClick={() => { setGpuFamily("全部 GPU"); setMinimumStock("不限库存"); }}>重置筛选</button></div>}<div className="responsive-table"><div className="table-row table-head gpu-table"><span>GPU 型号</span><span>计算配置</span><span>区域 / 可用区</span><span>库存</span><span>{billing === "包月" ? "包月单价" : "按量单价"}</span><span>长期价格</span><span /></div>{gpuRows.filter((gpu) => (region === "全部区域" || gpu.region.startsWith(region)) && (gpuFamily === "全部 GPU" || gpu.name.includes(gpuFamily)) && (minimumStock === "不限库存" || gpu.stock >= Number(minimumStock.match(/\d+/)?.[0] ?? 0))).map((gpu) => <div className="table-row gpu-table" key={gpu.name}><div className="gpu-name"><span className="gpu-mark">GPU</span><span><strong>{gpu.name}</strong><small>{gpu.vram}</small></span></div><span>{gpu.compute}</span><span>{gpu.region}</span><span className="stock"><i />{gpu.stock} 可用</span><strong>{billing === "包月" ? gpu.monthly : gpu.ondemand}<small> / GPU / 时</small></strong><span>{gpu.monthly}<small className="saving">{gpu.saving}</small></span><button className="primary compact" onClick={() => setMode("创建服务器")}>部署</button></div>)}</div></section>
      <div className="resource-notes"><article><HardDrive size={19} /><div><b>块存储</b><span>从 $0.0002 / GiB / 小时</span></div></article><article><Network size={19} /><div><b>公网与 VPC</b><span>共享带宽免费，独享带宽按量</span></div></article><article><ShieldCheck size={19} /><div><b>安全组</b><span>默认拒绝入站，可绑定 4 个规则组</span></div></article></div>
    </> : <section className="panel table-panel"><div className="table-toolbar"><div><h3>任务列表</h3><span>{taskRange} · 默认工作空间</span></div><div className="toolbar-actions"><label className="search-box"><Search size={15} /><input value={taskQuery} onChange={(event) => setTaskQuery(event.target.value)} placeholder="搜索任务名称" /></label><label className="select-control"><CalendarClock size={14} /><select value={taskRange} onChange={(event) => setTaskRange(event.target.value)}><option>近 7 天</option><option>近 30 天</option><option>近 90 天</option></select><ChevronDown size={14} /></label><button className="icon-button" title="刷新任务" onClick={() => onNotice("任务状态已刷新")}><RefreshCw size={15} /></button></div></div><div className="responsive-table"><div className="table-row table-head task-table"><span>任务名称</span><span>关联集群</span><span>框架</span><span>任务规格</span><span>副本数</span><span>优先级</span><span>状态</span><span>操作</span></div>{tasks.filter(([name]) => name.toLowerCase().includes(taskQuery.toLowerCase())).map(([name, cluster, framework, spec, replicas, priority, taskStatus]) => <div className="table-row task-table" key={name}><div className="instance-name"><strong>{name}</strong><small>创建于 2026-08-08</small></div><span>{cluster}</span><span>{framework}</span><span>{spec}</span><span>{replicas}</span><span>{priority}</span><span className={`status-label ${taskStatus === "运行中" || taskStatus === "已完成" ? "success" : "warning"}`}><i />{taskStatus}</span><button className="outline-button" onClick={() => onNotice(`已打开任务 ${name}`)}>详情</button></div>)}</div></section>}
  </div>;
}

function InstancesPage({ onRent, onNotice, instances, setInstances }: ConsoleSectionsProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("全部状态");
  const [instanceView, setInstanceView] = useState("实例列表");
  const [editing, setEditing] = useState<Instance | null>(null);
  const [moreInstanceId, setMoreInstanceId] = useState<string | null>(null);
  const visible = useMemo(() => instances.filter((instance) => (status === "全部状态" || instance.status === status) && `${instance.name}${instance.id}${instance.publicIp}`.toLowerCase().includes(query.toLowerCase())), [instances, query, status]);
  const togglePower = (id: string) => setInstances((items) => items.map((item) => item.id === id ? { ...item, status: item.status === "运行中" ? "已停止" : "运行中" } : item));
  const saveInstance = () => {
    if (!editing) return;
    setInstances((items) => items.map((item) => item.id === editing.id ? editing : item));
    setEditing(null);
    onNotice("实例配置已保存");
  };
  const exportInstances = () => {
    downloadCsv("instances.csv", [["实例名称", "实例 ID", "状态", "区域", "规格", "公网 IP", "计费"], ...visible.map((item) => [item.name, item.id, item.status, `${item.region}/${item.zone}`, item.spec, item.publicIp, item.billing])]);
    onNotice(`已导出 ${visible.length} 个实例`);
  };
  const duplicateInstance = (instance: Instance) => {
    setInstances((items) => [...items, { ...instance, id: `${instance.id}-copy`, name: `${instance.name}-copy`, status: "已停止", publicIp: "未绑定" }]);
    setMoreInstanceId(null);
    onNotice("实例副本已创建");
  };
  return <div className="console-page">
    <PageHeader eyebrow="COMPUTE / INSTANCES" title="实例管理" description="查看服务器状态、网络、镜像与计费信息，并执行日常运维操作。" action="新建实例" onAction={onRent} />
    <div className="module-tabs">{["实例列表", "云助手", "密钥对"].map((item) => <button key={item} className={instanceView === item ? "active" : ""} onClick={() => setInstanceView(item)}>{item}</button>)}</div>
    {instanceView === "实例列表" ? <><Metrics items={[
      { label: "实例总数", value: String(instances.length), note: `${new Set(instances.map((item) => item.region)).size} 个区域`, icon: <Server size={18} /> },
      { label: "运行中", value: String(instances.filter((item) => item.status === "运行中").length), note: "资源使用正常", icon: <Activity size={18} />, tone: "green" },
      { label: "GPU 使用率", value: "72%", note: "平均值", icon: <Gauge size={18} />, tone: "orange" },
      { label: "预计本月", value: "$186.42", note: "较预算低 18%", icon: <CircleDollarSign size={18} />, tone: "purple" },
    ]} />
    <section className="panel table-panel"><div className="table-toolbar"><div className="toolbar-actions"><label className="search-box wide-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索名称、实例 ID 或 IP" /></label><label className="select-control"><Filter size={15} /><select value={status} onChange={(event) => setStatus(event.target.value)}><option>全部状态</option><option>运行中</option><option>已停止</option></select><ChevronDown size={14} /></label></div><div className="toolbar-actions"><button className="outline-button" onClick={exportInstances}><Download size={14} />导出</button><button className="icon-button" title="刷新列表" onClick={() => onNotice("实例状态已刷新")}><RefreshCw size={15} /></button></div></div><div className="responsive-table"><div className="table-row table-head instance-table"><span>实例名称 / ID</span><span>状态</span><span>区域 / 可用区</span><span>规格与磁盘</span><span>系统镜像</span><span>公网 / 私网 IP</span><span>计费</span><span>操作</span></div>{visible.map((instance) => <div className="table-row instance-table" key={instance.id}><div className="instance-name"><strong>{instance.name}</strong><small>{instance.id}</small></div><span className={`status-label ${instance.status === "运行中" ? "success" : "neutral"}`}><i />{instance.status}</span><span>{instance.region}<small>{instance.zone}</small></span><span>{instance.spec}<small>{instance.disk}</small></span><span>{instance.os}</span><span className="ip-cell"><code>{instance.publicIp}</code><small>{instance.privateIp}</small></span><span>{instance.billing}<small>{instance.price}</small></span><div className="row-menu"><button title="启动或停止" onClick={() => { togglePower(instance.id); onNotice(instance.status === "运行中" ? "实例已停止" : "实例已启动"); }}><Power size={15} /></button><button title="编辑实例" onClick={() => setEditing(instance)}><Edit3 size={15} /></button><button title="更多操作" aria-expanded={moreInstanceId === instance.id} onClick={() => setMoreInstanceId((current) => current === instance.id ? null : instance.id)}><MoreHorizontal size={16} /></button>{moreInstanceId === instance.id && <div className="row-action-popover"><button onClick={() => duplicateInstance(instance)}>创建副本</button><button onClick={() => { setMoreInstanceId(null); onNotice(`已打开 ${instance.name} 重置密码流程`); }}>重置密码</button><button className="danger" onClick={() => { setInstances((items) => items.filter((item) => item.id !== instance.id)); setMoreInstanceId(null); onNotice("实例已删除"); }}>删除实例</button></div>}</div></div>)}</div></section></> : instanceView === "密钥对" ? <SshKeysView onNotice={onNotice} /> : <CloudAssistantView onNotice={onNotice} />}
    {editing && <div className="modal-backdrop" onMouseDown={() => setEditing(null)}><section className="edit-dialog" role="dialog" aria-modal="true" aria-label="编辑实例" onMouseDown={(event) => event.stopPropagation()}><div className="dialog-head"><div><span>INSTANCE SETTINGS</span><h3>编辑实例</h3><p>{editing.id}</p></div><button className="icon-button" onClick={() => setEditing(null)} aria-label="关闭"><X size={18} /></button></div><div className="form-grid"><label className="full">实例名称<input value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} /></label><label>计费方式<select value={editing.billing} onChange={(event) => setEditing({ ...editing, billing: event.target.value })}><option>按量计费</option><option>包月</option></select></label><label>系统镜像<select value={editing.os} onChange={(event) => setEditing({ ...editing, os: event.target.value })}><option>Ubuntu 24.04</option><option>Ubuntu 22.04</option><option>PyTorch 2.5</option></select></label><label className="full">实例规格<select value={editing.spec} onChange={(event) => setEditing({ ...editing, spec: event.target.value })}><option>RTX 4090 · 16C 64G</option><option>A100 80G · 24C 180G</option><option>L40S 48G · 20C 96G</option></select></label></div><div className="change-note"><CloudCog size={18} /><span><b>配置变更说明</b>运行中的实例变配需要短暂停机，新配置将在重启后生效。</span></div><div className="dialog-actions"><button className="secondary" onClick={() => setEditing(null)}>取消</button><button className="primary" onClick={saveInstance}>保存变更</button></div></section></div>}
  </div>;
}

function SshKeysView({ onNotice }: { onNotice: (message: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [keys, setKeys] = useState([{ name: "hexbit-production", fingerprint: "SHA256:mQ8f...p91c", created: "2026-07-18 14:32" }]);
  const visibleKeys = keys.filter((key) => `${key.name}${key.fingerprint}`.toLowerCase().includes(query.toLowerCase()));
  const create = () => {
    if (!/^[A-Za-z0-9_]{1,25}$/.test(name)) return;
    setKeys((items) => [...items, { name, fingerprint: "SHA256:new...7f2a", created: "2026-08-08 11:20" }]);
    setOpen(false);
    setName("");
    onNotice("密钥对已创建，私钥文件已准备下载");
  };
  return <>
    <section className="panel table-panel"><div className="table-toolbar"><div><h3>密钥对</h3><span>{visibleKeys.length} 个密钥对</span></div><div className="toolbar-actions"><label className="search-box"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="请输入密钥对" /></label><button className="icon-button" title="刷新列表" onClick={() => onNotice("密钥对列表已刷新")}><RefreshCw size={15} /></button><button className="primary compact" onClick={() => setOpen(true)}><Plus size={14} />创建密钥对</button></div></div><div className="responsive-table"><div className="table-row table-head ssh-key-table"><span>密钥对名称</span><span>指纹</span><span>创建时间</span><span>操作</span></div>{visibleKeys.map((key) => <div className="table-row ssh-key-table" key={key.name}><strong>{key.name}</strong><code>{key.fingerprint}</code><span>{key.created}</span><div className="row-menu"><button title="复制指纹" onClick={() => { navigator.clipboard?.writeText(key.fingerprint); onNotice("密钥指纹已复制"); }}><Clipboard size={15} /></button><button title="删除密钥对" onClick={() => setKeys((items) => items.filter((item) => item.name !== key.name))}><Trash2 size={15} /></button></div></div>)}</div></section>
    {open && <div className="modal-backdrop" onMouseDown={() => setOpen(false)}><section className="edit-dialog" role="dialog" aria-modal="true" aria-label="创建密钥对" onMouseDown={(event) => event.stopPropagation()}><div className="dialog-head"><div><span>COMPUTE / SSH KEY</span><h3>创建密钥对</h3><p>创建后仅提供一次私钥下载</p></div><button className="icon-button" aria-label="关闭" onClick={() => setOpen(false)}><X size={18} /></button></div><div className="key-warning"><ShieldCheck size={18} /><span><b>请妥善保存私钥</b>私钥不会存储在平台中，关闭下载窗口后无法再次获取。</span></div><div className="form-grid"><label className="full">密钥对名称<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="1~25 个字符，仅支持字母、数字或下划线" /></label><label className="full toggle-line"><span><b>创建方式</b><small>平台生成新的 RSA 2048 密钥对</small></span><strong>创建新密钥对</strong></label></div><div className="dialog-actions"><button className="secondary" onClick={() => setOpen(false)}>取消</button><button className="primary" disabled={!/^[A-Za-z0-9_]{1,25}$/.test(name)} onClick={create}>确定</button></div></section></div>}
  </>;
}

function CloudAssistantView({ onNotice }: { onNotice: (message: string) => void }) {
  const rows = [["prod-inference-01", "Linux", "2.8.1", "在线", "2026-08-08 10:42"], ["qwen-finetune", "Linux", "2.8.1", "在线", "2026-08-08 10:39"], ["dev-notebook", "Linux", "未安装", "离线", "-"]];
  return <section className="panel table-panel"><div className="table-toolbar"><div><h3>云助手</h3><span>在实例内安全执行命令、脚本和运维任务</span></div><div className="toolbar-actions"><button className="outline-button" onClick={() => onNotice("已打开批量执行命令")}>批量执行</button><button className="icon-button" title="刷新状态" onClick={() => onNotice("云助手状态已刷新")}><RefreshCw size={15} /></button></div></div><div className="responsive-table"><div className="table-row table-head assistant-table"><span>实例名称</span><span>系统</span><span>Agent 版本</span><span>连接状态</span><span>最后心跳</span><span>操作</span></div>{rows.map(([name, system, version, state, heartbeat]) => <div className="table-row assistant-table" key={name}><strong>{name}</strong><span>{system}</span><span>{version}</span><span className={`status-label ${state === "在线" ? "success" : "neutral"}`}><i />{state}</span><span>{heartbeat}</span><button className="outline-button" onClick={() => onNotice(state === "在线" ? `已打开 ${name} 命令执行` : "请先安装云助手 Agent")}>{state === "在线" ? "执行命令" : "安装"}</button></div>)}</div></section>;
}

function ResourceCenterPage({ onNotice }: ConsoleSectionsProps) {
  const [resourceView, setResourceView] = useState("资源");
  const [createGroupRequest, setCreateGroupRequest] = useState(0);
  const [group, setGroup] = useState("全部资源组");
  const [type, setType] = useState("全部资源类型");
  const [query, setQuery] = useState("");
  const resources = [
    { name: "eip-zhejiangshengwang-b7c74ff5", display: "zjsw_cq02a", type: "弹性公网 IP", zone: "重庆二区 · 可用区 A", group: "default", subscription: "共享订阅", created: "2026-08-03 17:16" },
    { name: "vpc-zhejiangshengwang-enw25jpr", display: "生产网络", type: "私有网络 VPC", zone: "重庆二区 · 可用区 A", group: "default", subscription: "共享订阅", created: "2026-07-15 11:11" },
    { name: "ts-zhejiangshengwang-019f63c1", display: "默认监控空间", type: "监控空间", zone: "重庆二区", group: "default", subscription: "共享订阅", created: "2026-07-15 11:12" },
    { name: "vol-cq02-prod-0291", display: "推理数据盘", type: "块存储", zone: "重庆二区 · 可用区 A", group: "inference", subscription: "生产订阅", created: "2026-08-06 09:28" },
  ];
  const visible = resources.filter((item) => (group === "全部资源组" || item.group === group) && (type === "全部资源类型" || item.type === type) && `${item.name}${item.display}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="console-page">
    <PageHeader eyebrow="RESOURCE CENTER / INVENTORY" title="资源中心" description="跨产品查看资源、资源组、订阅、标签和授权关系。" action="新建资源组" onAction={() => { setResourceView("资源组"); setCreateGroupRequest((value) => value + 1); }} />
    <div className="module-tabs">{["资源", "资源组", "订阅", "标签", "配额"].map((item) => <button key={item} className={resourceView === item ? "active" : ""} onClick={() => setResourceView(item)}>{item}</button>)}</div>
    <div className="resource-metrics"><Metrics items={[
      { label: "资源总数", value: "28", note: "7 种资源类型", icon: <Boxes size={18} /> },
      { label: "资源组", value: "3", note: "1 个共享资源组", icon: <Layers3 size={18} />, tone: "green" },
      { label: "订阅", value: "2", note: "全部状态正常", icon: <ReceiptText size={18} />, tone: "orange" },
      { label: "标签覆盖", value: "86%", note: "4 个资源待补充", icon: <Tag size={18} />, tone: "purple" },
    ]} /></div>
    {resourceView === "资源" ? <section className="panel table-panel"><div className="table-toolbar resource-filterbar"><div className="toolbar-actions resource-filter-fields"><FilterMenu icon={<Layers3 size={15} />} value={group} options={["全部资源组", "default", "inference"]} onChange={setGroup} /><FilterMenu icon={<Boxes size={15} />} value={type} options={["全部资源类型", "弹性公网 IP", "私有网络 VPC", "监控空间", "块存储"]} onChange={setType} /><label className="search-box wide-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="资源名称或显示名称" /></label></div><div className="toolbar-actions resource-filter-actions"><button className="outline-button" onClick={() => { setGroup("全部资源组"); setType("全部资源类型"); setQuery(""); }}>重置</button><button className="primary compact" onClick={() => onNotice(`已筛选到 ${visible.length} 个资源`)}>筛选</button></div></div><div className="responsive-table"><div className="table-row table-head resource-center-table"><span>资源名称 / 显示名称</span><span>资源类型</span><span>地区 / 可用区</span><span>资源组</span><span>订阅</span><span>标签</span><span>创建时间</span><span>操作</span></div>{visible.map((item) => <div className="table-row resource-center-table" key={item.name}><div className="instance-name"><strong>{item.display}</strong><small>{item.name}</small></div><span>{item.type}</span><span>{item.zone}</span><span>{item.group}</span><span>{item.subscription}</span><span className="tag-cell"><Tag size={13} />production</span><span>{item.created}</span><button className="outline-button" onClick={() => onNotice(`已打开 ${item.display} 授权设置`)}>授权</button></div>)}</div></section> : resourceView === "资源组" ? <ResourceGroupsView key={createGroupRequest} onNotice={onNotice} createRequest={createGroupRequest} /> : resourceView === "标签" ? <ResourceTagsView onNotice={onNotice} /> : <ResourceDirectoryView view={resourceView} onNotice={onNotice} />}
  </div>;
}

function ResourceGroupsView({ onNotice, createRequest }: { onNotice: (message: string) => void; createRequest: number }) {
  const [open, setOpen] = useState(createRequest > 0);
  const [name, setName] = useState("");
  const [groupQuery, setGroupQuery] = useState("");
  const [subscriptionQuery, setSubscriptionQuery] = useState("");
  const [groups, setGroups] = useState([{ name: "default", display: "共享资源组", count: 4, subscription: "共享订阅", management: "根管理组", created: "2026-07-15 11:11" }]);
  const visibleGroups = groups.filter((group) => `${group.name}${group.display}`.toLowerCase().includes(groupQuery.toLowerCase()) && group.subscription.toLowerCase().includes(subscriptionQuery.toLowerCase()));
  const create = () => {
    if (!name.trim()) return;
    setGroups((items) => [...items, { name: name.toLowerCase().replace(/\s+/g, "-"), display: name, count: 0, subscription: "共享订阅", management: "根管理组", created: "2026-08-08 11:30" }]);
    setName("");
    setOpen(false);
    onNotice("资源组已创建");
  };
  return <>
    <section className="panel table-panel"><div className="table-toolbar resource-filterbar"><div className="toolbar-actions"><label className="search-box wide-search"><Search size={15} /><input value={groupQuery} onChange={(event) => setGroupQuery(event.target.value)} placeholder="资源组显示名称" /></label><label className="search-box"><Search size={15} /><input value={subscriptionQuery} onChange={(event) => setSubscriptionQuery(event.target.value)} placeholder="订阅显示名称" /></label></div><div className="toolbar-actions"><button className="outline-button" onClick={() => { setGroupQuery(""); setSubscriptionQuery(""); }}>重置</button><button className="primary compact" onClick={() => setOpen(true)}><Plus size={14} />创建资源组</button></div></div><div className="responsive-table"><div className="table-row table-head resource-group-table"><span>资源组名称 / 显示名称</span><span>资源数量</span><span>订阅</span><span>管理组</span><span>创建时间</span><span>操作</span></div>{visibleGroups.map((group) => <div className="table-row resource-group-table" key={group.name}><div className="instance-name"><strong>{group.display}</strong><small>{group.name}</small></div><b>{group.count}</b><span>{group.subscription}</span><span>{group.management}</span><span>{group.created}</span><button className="outline-button" onClick={() => onNotice(`已打开 ${group.display} 授权设置`)}>添加授权</button></div>)}</div></section>
    {open && <div className="modal-backdrop" onMouseDown={() => setOpen(false)}><section className="edit-dialog" role="dialog" aria-modal="true" aria-label="创建资源组" onMouseDown={(event) => event.stopPropagation()}><div className="dialog-head"><div><span>RESOURCE CENTER / GROUP</span><h3>创建资源组</h3><p>资源组用于统一组织资源和授权</p></div><button className="icon-button" aria-label="关闭" onClick={() => setOpen(false)}><X size={18} /></button></div><div className="form-grid"><label className="full">资源组显示名称<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：生产推理资源" /></label><label>所属订阅<select><option>共享订阅</option><option>生产订阅</option></select></label><label>所属管理组<select><option>根管理组</option></select></label></div><div className="dialog-actions"><button className="secondary" onClick={() => setOpen(false)}>取消</button><button className="primary" disabled={!name.trim()} onClick={create}>创建</button></div></section></div>}
  </>;
}

function ResourceTagsView({ onNotice }: { onNotice: (message: string) => void }) {
  const [tags, setTags] = useState([{ key: "environment", values: "production, staging", resources: 24 }]);
  const [open, setOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [tagValue, setTagValue] = useState("");
  const [query, setQuery] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const visibleTags = tags.filter((tag) => `${tag.key}${tag.values}`.toLowerCase().includes(query.toLowerCase()));
  return <>
    <section className="panel table-panel"><div className="table-toolbar"><label className="search-box wide-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="输入标签键关键字进行搜索" /></label><button className="primary compact" onClick={() => { setEditingKey(null); setKeyName(""); setTagValue(""); setOpen(true); }}><Plus size={14} />创建标签</button></div><div className="responsive-table"><div className="table-row table-head resource-tag-table"><span>标签键</span><span>标签值</span><span>绑定资源数</span><span>操作</span></div>{visibleTags.map((tag) => <div className="table-row resource-tag-table" key={tag.key}><strong>{tag.key}</strong><span>{tag.values}</span><b>{tag.resources}</b><div className="row-menu"><button title="编辑标签" onClick={() => { setEditingKey(tag.key); setKeyName(tag.key); setTagValue(tag.values); setOpen(true); }}><Edit3 size={15} /></button><button title="删除标签" onClick={() => setTags((items) => items.filter((item) => item.key !== tag.key))}><Trash2 size={15} /></button></div></div>)}</div></section>
    {open && <div className="modal-backdrop" onMouseDown={() => setOpen(false)}><section className="edit-dialog" role="dialog" aria-modal="true" aria-label={editingKey ? "编辑标签" : "创建标签"} onMouseDown={(event) => event.stopPropagation()}><div className="dialog-head"><div><span>RESOURCE CENTER / TAG</span><h3>{editingKey ? "编辑标签" : "创建标签"}</h3><p>使用键值对分类和筛选资源</p></div><button className="icon-button" aria-label="关闭" onClick={() => setOpen(false)}><X size={18} /></button></div><div className="form-grid"><label className="full">标签键<input autoFocus value={keyName} onChange={(event) => setKeyName(event.target.value)} placeholder="例如：department" /></label><label className="full">标签值<input value={tagValue} onChange={(event) => setTagValue(event.target.value)} placeholder="例如：ai-platform" /></label></div><div className="dialog-actions"><button className="secondary" onClick={() => setOpen(false)}>取消</button><button className="primary" disabled={!keyName.trim() || !tagValue.trim()} onClick={() => { setTags((items) => [...items.filter((item) => item.key !== (editingKey ?? keyName)), { key: keyName, values: tagValue, resources: editingKey ? items.find((item) => item.key === editingKey)?.resources ?? 0 : 0 }]); setEditingKey(null); setKeyName(""); setTagValue(""); setOpen(false); onNotice("标签已保存"); }}>保存</button></div></section></div>}
  </>;
}

function ResourceDirectoryView({ view, onNotice }: { view: string; onNotice: (message: string) => void }) {
  const subscriptions = [["共享订阅", "019f63c1-b809-7e47-87dd-5686efa030ce", "28", "正常"], ["生产订阅", "sub-prod-cq02", "12", "正常"]];
  if (view === "订阅") return <section className="panel table-panel"><div className="table-toolbar"><div><h3>订阅</h3><span>管理资源计费和归属边界</span></div><button className="outline-button" onClick={() => onNotice("订阅数据已刷新")}><RefreshCw size={14} />刷新</button></div><div className="responsive-table"><div className="table-row table-head subscription-table"><span>订阅显示名称 / ID</span><span>资源数量</span><span>管理组</span><span>状态</span><span>操作</span></div>{subscriptions.map(([name, id, count, state]) => <div className="table-row subscription-table" key={id}><div className="instance-name"><strong>{name}</strong><small>{id}</small></div><b>{count}</b><span>根管理组</span><span className="status-label success"><i />{state}</span><button className="outline-button" onClick={() => onNotice(`已打开 ${name}`)}>详情</button></div>)}</div></section>;
  return <section className="panel table-panel"><div className="table-toolbar"><div><h3>用户配额</h3><span>按资源类型控制用户可使用上限</span></div><button className="outline-button" onClick={() => onNotice("配额数据已刷新")}><RefreshCw size={14} />刷新</button></div><div className="responsive-table"><div className="table-row table-head quota-table"><span>资源类型</span><span>区域</span><span>已使用</span><span>配额上限</span><span>使用率</span><span>操作</span></div>{[["GPU 卡", "重庆二区", "6", "32", "19%"], ["公网 IP", "重庆二区", "1", "10", "10%"], ["存储容量", "重庆二区", "2.4 TiB", "10 TiB", "24%"]].map(([type, region, used, limit, rate]) => <div className="table-row quota-table" key={type}><strong>{type}</strong><span>{region}</span><span>{used}</span><span>{limit}</span><div className="key-usage"><div className="progress"><i style={{ width: rate }} /></div><small>{rate}</small></div><button className="outline-button" onClick={() => onNotice(`已打开 ${type} 配额申请`)}>申请调整</button></div>)}</div></section>;
}

function MonitorPage({ onNotice }: ConsoleSectionsProps) {
  const [range, setRange] = useState("24 小时");
  const [monitorView, setMonitorView] = useState("概览");
  const [severity, setSeverity] = useState("全部等级");
  return <div className="console-page">
    <PageHeader eyebrow="OBSERVABILITY / CLOUD MONITOR" title="云监控" description="集中查看资源指标、告警趋势、事件和日志状态。" action="创建告警规则" onAction={() => onNotice("已打开告警规则创建流程")} />
    <div className="module-tabs">{["概览", "云产品监控", "仪表盘", "告警规则", "事件", "日志"].map((item) => <button key={item} className={monitorView === item ? "active" : ""} onClick={() => setMonitorView(item)}>{item}</button>)}</div>
    {monitorView === "概览" ? <><Metrics items={[
      { label: "紧急告警", value: "0", note: "近 24 小时", icon: <TriangleAlert size={18} /> },
      { label: "重要告警", value: "0", note: "近 24 小时", icon: <Bell size={18} />, tone: "orange" },
      { label: "监控资源", value: "28", note: "全部采集正常", icon: <Activity size={18} />, tone: "green" },
      { label: "告警规则", value: "12", note: "10 个已启用", icon: <ShieldCheck size={18} />, tone: "purple" },
    ]} />
    <div className="console-split monitor-overview"><section className="panel monitor-chart"><div className="panel-title"><div><h3>告警趋势</h3><p>{range}内按等级汇总</p></div><div className="segmented small">{["24 小时", "7 天", "30 天"].map((item) => <button key={item} className={range === item ? "active" : ""} onClick={() => setRange(item)}>{item}</button>)}</div></div><div className="monitor-bars">{[12,18,9,22,14,17,11,8,16,10,7,13].map((height, index) => <i key={index} style={{ height: `${height + 12}%` }} />)}</div><div className="monitor-axis"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>现在</span></div></section><section className="panel monitor-health"><div className="panel-title"><div><h3>采集健康度</h3><p>实时监控链路</p></div></div><div className="health-score"><strong>99.99%</strong><span>数据采集成功率</span></div><div className="health-items"><span><i />指标采集 <b>正常</b></span><span><i />事件通道 <b>正常</b></span><span><i />通知通道 <b>正常</b></span></div></section></div>
    <section className="panel table-panel"><div className="table-toolbar"><div><h3>近 24 小时告警历史</h3><span>{severity} · 当前没有未恢复告警</span></div><div className="toolbar-actions"><label className="select-control"><Filter size={14} /><select value={severity} onChange={(event) => setSeverity(event.target.value)}><option>全部等级</option><option>紧急</option><option>重要</option><option>次要</option><option>提示</option></select><ChevronDown size={14} /></label><button className="icon-button" title="刷新告警" onClick={() => onNotice("告警数据已刷新")}><RefreshCw size={15} /></button></div></div><div className="monitor-empty"><ShieldCheck size={34} /><h3>所有资源运行正常</h3><p>当前筛选范围内没有告警记录。</p><button className="text-button" onClick={() => setMonitorView("告警规则")}>查看告警规则</button></div></section></> : monitorView === "告警规则" ? <MonitorRulesView onNotice={onNotice} /> : <MonitorDirectoryView view={monitorView} onNotice={onNotice} />}
  </div>;
}

function MonitorRulesView({ onNotice }: { onNotice: (message: string) => void }) {
  const [category, setCategory] = useState("云产品监控");
  const [enabled, setEnabled] = useState(true);
  return <section className="panel table-panel"><div className="table-toolbar"><div className="segmented">{["云产品监控", "自定义监控"].map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div><div className="toolbar-actions"><label className="select-control"><Boxes size={15} /><select><option>全部产品</option><option>私有网络 VPC</option><option>计算实例</option></select><ChevronDown size={14} /></label><label className="search-box"><Search size={15} /><input placeholder="告警规则名称 / ID" /></label><button className="primary compact" onClick={() => onNotice("已打开告警规则创建流程")}><Plus size={14} />创建告警规则</button></div></div><div className="responsive-table"><div className="table-row table-head alarm-rule-table"><span>规则名称 / ID</span><span>告警产品</span><span>告警资源</span><span>告警策略</span><span>启用状态</span><span>通知组</span><span>创建人</span><span>操作</span></div><div className="table-row alarm-rule-table"><div className="instance-name"><strong>VPC 网关性能限制告警</strong><small>9c9df5e9-49f9-4522-93b7-82338c4a6d63</small></div><span>私有网络 VPC</span><span>全部资源</span><div className="policy-cell"><b>任一指标满足条件</b><small>并发连接数 &gt; 80,000 · 连续 3 个周期</small><small>入方向带宽 &gt; 8,000 Mbps</small></div><label className="inline-switch"><input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} /><span>{enabled ? "已启用" : "已禁用"}</span></label><span>系统预置通知组</span><span>zhejiangshengwang</span><div className="row-menu"><button title="告警历史" onClick={() => onNotice("已打开告警历史")}><Activity size={15} /></button><button title="编辑规则" onClick={() => onNotice("已打开规则编辑") }><Edit3 size={15} /></button></div></div></div></section>;
}

function MonitorDirectoryView({ view, onNotice }: { view: string; onNotice: (message: string) => void }) {
  if (view === "云产品监控") return <section className="panel table-panel"><div className="table-toolbar"><div><h3>云产品监控</h3><span>按产品查看资源指标和健康度</span></div><button className="icon-button" title="刷新指标" onClick={() => onNotice("监控指标已刷新")}><RefreshCw size={15} /></button></div><div className="product-monitor-grid">{[["计算实例", "3", "36", "正常"], ["私有网络 VPC", "1", "12", "正常"], ["弹性公网 IP", "1", "8", "正常"], ["块存储", "4", "24", "正常"]].map(([name, resources, metrics, state]) => <article key={name}><div><Activity size={18} /><strong>{name}</strong></div><span>{resources} 个资源 · {metrics} 个指标</span><b><i />{state}</b><button onClick={() => onNotice(`已打开 ${name} 监控详情`)}>查看监控</button></article>)}</div></section>;
  return <section className="panel table-panel"><div className="table-toolbar"><div><h3>{view}</h3><span>{view === "仪表盘" ? "自定义监控数据可视化" : view === "事件" ? "资源生命周期与系统事件" : "集中检索和分析运行日志"}</span></div><button className="primary compact" onClick={() => onNotice(`已打开${view}创建流程`)}><Plus size={14} />新建{view}</button></div><div className="monitor-empty"><Activity size={34} /><h3>暂无{view}数据</h3><p>创建第一个{view}配置后，数据将在这里展示。</p></div></section>;
}

function BillingPage({ balance, onCharge, onNotice }: ConsoleSectionsProps) {
  const [range, setRange] = useState("本月");
  const [billingView, setBillingView] = useState("费用总览");
  const [productFilter, setProductFilter] = useState("全部产品");
  const bills = [
    ["2026-08-07 10:00", "GPU 云服务器", "prod-inference-01", "按量计费 · 1 小时", "-$0.42"],
    ["2026-08-07 09:00", "模型 API", "Qwen3-235B-A22B", "输入 1.8M · 输出 0.4M", "-$0.61"],
    ["2026-08-07 08:00", "块存储", "vol-sg-0291", "480 GiB · 1 小时", "-$0.10"],
    ["2026-08-06 18:32", "账户充值", "TRC20 · 已确认", "交易 0xb21...8e4", "+$500.00"],
    ["2026-08-06 16:00", "GPU 云服务器", "qwen-finetune", "包月续费", "-$568.00"],
  ];
  const visibleBills = bills.filter((bill) => productFilter === "全部产品" || bill[1] === productFilter);
  return <div className="console-page">
    <PageHeader eyebrow="FINANCE / BILLING" title="用量与账单" description="按产品、资源和时间查看成本，跟踪余额与预算执行情况。" action="充值 USDT" onAction={onCharge} />
    <div className="module-tabs">{["费用总览", "账户管理", "订单管理", "账单管理", "成本分析"].map((item) => <button key={item} className={billingView === item ? "active" : ""} onClick={() => setBillingView(item)}>{item}</button>)}</div>
    {billingView === "成本分析" ? <CostAnalysisView onNotice={onNotice} /> : billingView === "费用总览" ? <><div className="billing-account-grid"><section className="panel account-summary"><div className="panel-title"><div><h3>账户信息</h3><p>默认计费账户 · 关联 1 个订阅</p></div><button className="text-button" onClick={() => onNotice("已打开账户详情")}>查看详情</button></div><div className="account-balance"><div><span>可用余额</span><strong>{balance.toFixed(2)} <small>USDT</small></strong></div><button className="primary compact" onClick={onCharge}>充值</button></div><div className="balance-alert"><span><Bell size={14} />余额预警</span><b>低于 200 USDT 时通知</b><button className="text-button" onClick={() => onNotice("已打开余额预警设置")}>修改</button></div></section><section className="panel renewal-summary"><div className="panel-title"><div><h3>待续费资源</h3><p>1 个资源已超期</p></div><button className="text-button" onClick={() => onNotice("已打开续费管理")}>查看更多</button></div><div className="renewal-row"><div><strong>eip-zhejiangshengwang-b7c74ff5</strong><span>弹性公网 IP · 重庆二区 A</span></div><b>超期 3 天</b><button className="outline-button" onClick={() => onNotice("已打开续费确认")}>续订</button></div></section></div>
    <Metrics items={[
      { label: "可用余额", value: `${balance.toFixed(2)} USDT`, note: "预计可用 36 天", icon: <CircleDollarSign size={18} />, tone: "green" },
      { label: "本月消费", value: "$186.42", note: "较上月 +8.2%", icon: <ReceiptText size={18} /> },
      { label: "本月预算", value: "$500.00", note: "已使用 37.3%", icon: <Gauge size={18} />, tone: "orange" },
      { label: "待出账", value: "$12.86", note: "下一账期 09:00", icon: <RefreshCw size={18} />, tone: "purple" },
    ]} />
    <div className="console-split billing-overview"><section className="panel spend-chart"><div className="panel-title"><div><h3>消费趋势</h3><p>按日汇总 · USDT</p></div><div className="segmented small">{["7 天", "本月", "上月"].map((item) => <button key={item} className={range === item ? "active" : ""} onClick={() => setRange(item)}>{item}</button>)}</div></div><div className="line-chart"><div className="chart-grid"><span>$40</span><span>$30</span><span>$20</span><span>$10</span></div><svg viewBox="0 0 600 160" preserveAspectRatio="none" aria-label="消费趋势图"><path className="area" d="M0 135 L85 112 L170 123 L255 76 L340 91 L425 44 L510 62 L600 28 L600 160 L0 160 Z" /><path className="line" d="M0 135 L85 112 L170 123 L255 76 L340 91 L425 44 L510 62 L600 28" /></svg><div className="chart-labels"><span>08/01</span><span>08/03</span><span>08/05</span><span>08/07</span></div></div></section><section className="panel cost-breakdown"><div className="panel-title"><div><h3>产品占比</h3><p>本月费用构成</p></div></div>{[["GPU 云服务器", "68%", "$126.77"], ["模型 API", "22%", "$41.01"], ["存储与网络", "10%", "$18.64"]].map(([name, width, value], index) => <div className="breakdown-row" key={name}><div><span><i className={`cost-color c${index}`} />{name}</span><b>{value}</b></div><div className="progress"><i className={`c${index}`} style={{ width }} /></div><small>{width}</small></div>)}</section></div>
    <section className="panel table-panel"><div className="table-toolbar"><div><h3>交易明细</h3><span>{productFilter} · {visibleBills.length} 条记录</span></div><div className="toolbar-actions"><label className="select-control"><Filter size={14} /><select value={productFilter} onChange={(event) => setProductFilter(event.target.value)}><option>全部产品</option><option>GPU 云服务器</option><option>模型 API</option><option>块存储</option><option>账户充值</option></select><ChevronDown size={14} /></label><button className="outline-button" onClick={() => { downloadCsv("billing.csv", [["时间", "产品", "资源", "计费详情", "金额"], ...visibleBills]); onNotice("账单文件已下载"); }}><Download size={14} />导出账单</button></div></div><div className="responsive-table"><div className="table-row table-head billing-table"><span>时间</span><span>产品</span><span>资源</span><span>计费详情</span><span>金额</span><span>状态</span></div>{visibleBills.map(([date, product, resource, detail, amount]) => <div className="table-row billing-table" key={`${date}${resource}`}><span>{date}</span><span>{product}</span><strong>{resource}</strong><span>{detail}</span><b className={amount.startsWith("+") ? "positive" : ""}>{amount}</b><span className="status-label success"><i />已结算</span></div>)}</div></section></> : <BillingDirectoryView view={billingView} onNotice={onNotice} />}
  </div>;
}

function CostAnalysisView({ onNotice }: { onNotice: (message: string) => void }) {
  const [granularity, setGranularity] = useState("按天");
  const [dimension, setDimension] = useState("产品服务");
  const [startDate, setStartDate] = useState("2026-08-01");
  const [endDate, setEndDate] = useState("2026-08-07");
  const days = ["08-01", "08-02", "08-03", "08-04", "08-05", "08-06", "08-07"];
  const costs = [18.2, 22.4, 19.8, 31.5, 27.1, 34.8, 32.6];
  return <div className="cost-analysis-page"><div className="analysis-note"><TriangleAlert size={17} /><div><b>成本数据说明</b><span>支持查看近 12 个月的数据，成本按资源实际使用时间计入账期，并比账单数据延迟一天更新。</span></div></div><section className="panel analysis-filters"><div className="analysis-field"><span>时间粒度</span><div className="segmented">{["按天", "按月"].map((item) => <button key={item} className={granularity === item ? "active" : ""} onClick={() => setGranularity(item)}>{item}</button>)}</div></div><label className="analysis-field"><span>时间范围</span><div className="date-range"><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /><b>至</b><input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></div></label><label className="analysis-field"><span>分析维度</span><select value={dimension} onChange={(event) => setDimension(event.target.value)}><option>产品服务</option><option>资源组</option><option>地区与可用区</option><option>标签</option></select></label><div className="analysis-actions"><button className="primary compact" onClick={() => onNotice(`已按${dimension}生成 ${startDate} 至 ${endDate} 成本分析`)}>生成</button><button className="outline-button" onClick={() => { setGranularity("按天"); setDimension("产品服务"); setStartDate("2026-08-01"); setEndDate("2026-08-07"); }}>重置</button></div></section><section className="panel cost-trend-panel"><div className="panel-title"><div><h3>成本趋势</h3><p>{granularity} · 按{dimension}分析</p></div><button className="outline-button" onClick={() => { downloadCsv("cost-analysis.csv", [["日期", ...days], ["总成本", ...costs]]); onNotice("成本分析文件已下载"); }}><Download size={14} />导出</button></div><div className="cost-bars">{costs.map((cost, index) => <div key={days[index]}><span>${cost.toFixed(1)}</span><i style={{ height: `${cost * 3.2}px` }} /><small>{days[index]}</small></div>)}</div></section><section className="panel table-panel"><div className="table-toolbar"><div><h3>成本明细</h3><span>单位：USDT</span></div></div><div className="responsive-table"><div className="table-row table-head cost-detail-table"><span>产品服务</span>{days.map((day) => <span key={day}>{day}</span>)}<span>总计</span></div><div className="table-row cost-detail-table"><strong>总成本</strong>{costs.map((cost, index) => <span key={days[index]}>${cost.toFixed(2)}</span>)}<b>${costs.reduce((sum, cost) => sum + cost, 0).toFixed(2)}</b></div><div className="table-row cost-detail-table"><span>GPU 云服务器</span>{costs.map((cost, index) => <span key={days[index]}>${(cost * .68).toFixed(2)}</span>)}<b>$126.77</b></div></div></section></div>;
}

function BillingDirectoryView({ view, onNotice }: { view: string; onNotice: (message: string) => void }) {
  const copy: Record<string, [string, string, string[]]> = {
    "账户管理": ["计费账户", "统一管理账户资产、余额预警和关联订阅", ["默认计费账户", "研发计费账户"]],
    "订单管理": ["订单列表", "查看购买、续订、变配和退订订单", ["ord-20260808-0192", "ord-20260806-0188"]],
    "账单管理": ["账单列表", "按账期查看资源消费和结算状态", ["2026 年 8 月账单", "2026 年 7 月账单"]],
  };
  const [title, description, rows] = copy[view];
  const [query, setQuery] = useState("");
  const visibleRows = rows.filter((row) => row.toLowerCase().includes(query.toLowerCase()));
  return <section className="panel table-panel"><div className="table-toolbar"><div><h3>{title}</h3><span>{description}</span></div><div className="toolbar-actions"><label className="search-box"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`搜索${title}`} /></label><button className="outline-button" onClick={() => onNotice(`${title}已刷新`)}><RefreshCw size={14} />刷新</button></div></div><div className="directory-list">{visibleRows.map((row, index) => <article key={row}><div><ReceiptText size={18} /><span><strong>{row}</strong><small>{index === 0 ? "当前使用中" : "历史记录"}</small></span></div><span className="status-label success"><i />正常</span><button className="outline-button" onClick={() => onNotice(`已打开 ${row}`)}>查看详情</button></article>)}</div></section>;
}

function UsersPage({ onNotice }: { onNotice: (message: string) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("普通用户");
  const [scope, setScope] = useState("共享资源组");
  const [users, setUsers] = useState([{ name: "zhejiangshengwang", role: "根用户", status: "正常", lastLogin: "2026-08-08 10:42" }, { name: "ops-admin", role: "管理员", status: "正常", lastLogin: "2026-08-07 18:16" }]);
  const visibleUsers = users.filter((user) => user.name.toLowerCase().includes(query.toLowerCase()));
  const createUser = () => {
    if (!username.trim()) return;
    setUsers((items) => [...items, { name: username, role, status: "待激活", lastLogin: "-" }]);
    setUsername("");
    setOpen(false);
    onNotice("用户邀请已创建");
  };
  return <div className="console-page"><PageHeader eyebrow="IAM / USERS" title="用户与权限" description="管理企业用户、角色和资源访问授权。" action="创建用户" onAction={() => setOpen(true)} /><Metrics items={[{ label: "用户总数", value: String(users.length), note: "包含根用户", icon: <Server size={18} /> }, { label: "管理员", value: String(users.filter((user) => user.role === "管理员" || user.role === "根用户").length), note: "拥有管理权限", icon: <ShieldCheck size={18} />, tone: "green" }, { label: "待激活", value: String(users.filter((user) => user.status === "待激活").length), note: "等待首次登录", icon: <Bell size={18} />, tone: "orange" }, { label: "角色", value: String(new Set(users.map((user) => user.role)).size), note: "当前已分配角色", icon: <KeyRound size={18} />, tone: "purple" }]} /><section className="panel table-panel"><div className="table-toolbar"><div><h3>用户列表</h3><span>{visibleUsers.length} 个用户</span></div><label className="search-box wide-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索用户名" /></label></div><div className="responsive-table"><div className="table-row table-head user-table"><span>用户名</span><span>角色</span><span>状态</span><span>最后登录</span><span>操作</span></div>{visibleUsers.map((user) => <div className="table-row user-table" key={user.name}><strong>{user.name}</strong><span>{user.role}</span><span className={`status-label ${user.status === "正常" ? "success" : "warning"}`}><i />{user.status}</span><span>{user.lastLogin}</span><div className="row-menu"><button title="编辑用户" onClick={() => onNotice(`已打开 ${user.name} 权限设置`)}><Edit3 size={15} /></button><button title="删除用户" disabled={user.role === "根用户"} onClick={() => setUsers((items) => items.filter((item) => item.name !== user.name))}><Trash2 size={15} /></button></div></div>)}</div></section>{open && <div className="modal-backdrop" onMouseDown={() => setOpen(false)}><section className="edit-dialog" role="dialog" aria-modal="true" aria-label="创建用户" onMouseDown={(event) => event.stopPropagation()}><div className="dialog-head"><div><span>IAM / USER</span><h3>创建用户</h3><p>新用户将按所选范围获得 {scope} 权限</p></div><button className="icon-button" aria-label="关闭" onClick={() => setOpen(false)}><X size={18} /></button></div><div className="form-grid"><label className="full">用户名<input autoFocus value={username} onChange={(event) => setUsername(event.target.value)} placeholder="请输入用户名" /></label><label>角色<select value={role} onChange={(event) => setRole(event.target.value)}><option>普通用户</option><option>管理员</option><option>只读用户</option></select></label><label>授权范围<select value={scope} onChange={(event) => setScope(event.target.value)}><option>共享资源组</option><option>全部资源</option></select></label></div><div className="dialog-actions"><button className="secondary" onClick={() => setOpen(false)}>取消</button><button className="primary" disabled={!username.trim()} onClick={createUser}>创建用户</button></div></section></div>}</div>;
}

function AccountCenterPage({ onNotice }: { onNotice: (message: string) => void }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [fields, setFields] = useState([["安全手机", "+86 130****3999"], ["安全邮箱", "683****@qq.com"], ["登录密码", "********"], ["消息订阅手机", "+86 130****3999"], ["消息订阅邮箱", "683****@qq.com"]]);
  const info = [["用户名", "zhejiangshengwang"], ["用户 ID", "019f63c1-b809-7e5c-a3dd-3893cbe11e57"], ["企业标识", "zhejiangshengwang"], ["创建时间", "2026-07-15 11:11:07"]];
  return <div className="console-page"><div className="console-page-head"><div><span>IAM / ACCOUNT</span><h2>账号中心</h2><p>查看账号身份信息并维护登录与消息订阅方式。</p></div></div><section className="panel account-info-panel"><div className="panel-title"><div><h3>基本信息</h3><p>线下签约 · 根用户</p></div></div><div className="account-info-grid">{info.map(([label, current]) => <div className="account-info-line" key={label}><span>{label}</span><b>{current}</b></div>)}</div></section><section className="panel account-security-panel"><div className="panel-title"><div><h3>登录方式与消息订阅</h3><p>修改安全信息后需要重新验证身份</p></div></div>{fields.map(([label, current]) => <div className="account-security-row" key={label}><span>{label}</span><b>{current}</b><button className="outline-button" onClick={() => { setEditing(label); setValue(""); }}>修改</button>{label.startsWith("消息订阅") && <button className="text-button" onClick={() => { setFields((items) => items.map((item) => item[0] === label ? [item[0], "未绑定"] : item)); onNotice(`${label}已解绑`); }}>解绑</button>}</div>)}</section>{editing && <div className="modal-backdrop" onMouseDown={() => setEditing(null)}><section className="edit-dialog" role="dialog" aria-modal="true" aria-label={`修改${editing}`} onMouseDown={(event) => event.stopPropagation()}><div className="dialog-head"><div><span>ACCOUNT SECURITY</span><h3>修改{editing}</h3><p>保存前将验证当前登录身份</p></div><button className="icon-button" aria-label="关闭" onClick={() => setEditing(null)}><X size={18} /></button></div><div className="form-grid"><label className="full">新{editing}<input autoFocus type={editing.includes("密码") ? "password" : "text"} value={value} onChange={(event) => setValue(event.target.value)} placeholder={`请输入新${editing}`} /></label></div><div className="dialog-actions"><button className="secondary" onClick={() => setEditing(null)}>取消</button><button className="primary" disabled={!value.trim()} onClick={() => { const label = editing; setFields((items) => items.map((item) => item[0] === label ? [item[0], label.includes("密码") ? "********" : value] : item)); setEditing(null); onNotice(`${label}已更新`); }}>保存</button></div></section></div>}</div>;
}

function MessageCenterPage() {
  const [category, setCategory] = useState("产品消息");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [read, setRead] = useState<string[]>([]);
  const messages = [["msg-01", "产品消息", "资源到期即将释放通知", "prod-inference-01 将于 3 天后到期", "2026-08-08 09:42"], ["msg-02", "财务消息", "续订失败提醒", "请检查默认计费账户余额", "2026-08-08 08:16"], ["msg-03", "平台消息", "重庆二区维护完成", "网络维护已完成，服务运行正常", "2026-08-07 23:40"]];
  const visible = messages.filter(([id, type]) => (category === "全部消息" || type === category) && (!unreadOnly || !read.includes(id)));
  return <div className="console-page"><div className="console-page-head"><div><span>MESSAGE CENTER</span><h2>消息中心</h2><p>集中查看产品、财务和平台通知。</p></div><label className="check-control"><input type="checkbox" checked={unreadOnly} onChange={(event) => setUnreadOnly(event.target.checked)} />仅看未读</label></div><div className="module-tabs">{["全部消息", "产品消息", "财务消息", "平台消息"].map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div><section className="panel message-center-list">{visible.map(([id, type, title, text, time]) => <button key={id} className={read.includes(id) ? "read" : ""} onClick={() => setRead((items) => items.includes(id) ? items : [...items, id])}><i /><span><b>{title}</b><small>{type} · {text}</small></span><time>{time}</time><strong>{read.includes(id) ? "已读" : "未读"}</strong></button>)}{visible.length === 0 && <div className="monitor-empty"><Check size={30} /><h3>没有未读消息</h3></div>}</section></div>;
}

function HelpCenterPage() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const docs = [["SenseCore 产品介绍", "平台概览与产品能力"], ["如何创建用户", "用户与权限管理"], ["如何为用户授权", "资源授权与角色配置"], ["资源管理介绍", "资源组、订阅与标签"], ["快速购买流程", "裸金属服务器购买配置"]];
  const visible = docs.filter(([title, description]) => `${title}${description}`.includes(query));
  if (selected) return <div className="console-page"><div className="server-create-head"><button className="icon-button" aria-label="返回帮助中心" onClick={() => setSelected(null)}><ChevronDown size={17} /></button><div><span>HELP / DOCUMENT</span><h2>{selected}</h2><p>更新时间：2026-08-08</p></div></div><section className="panel help-article"><h3>{selected}</h3><p>本指南按照控制台当前流程整理，包含入口位置、必填配置、权限要求和常见状态说明。</p><div><b>操作步骤</b><ol><li>进入对应产品控制台并选择目标资源。</li><li>填写基础配置，确认区域、资源组和授权范围。</li><li>检查右侧摘要后提交，随后可在列表中查看处理状态。</li></ol></div></section></div>;
  return <div className="console-page"><div className="console-page-head"><div><span>SUPPORT / DOCUMENTATION</span><h2>帮助中心</h2><p>查找产品介绍、操作指南和常见问题。</p></div><label className="search-box wide-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索帮助文档" /></label></div><section className="panel help-list">{visible.map(([title, description]) => <button key={title} onClick={() => setSelected(title)}><BookOpen size={18} /><span><b>{title}</b><small>{description}</small></span><ChevronDown size={15} /></button>)}</section></div>;
}

function KeysPage({ onNotice }: ConsoleSectionsProps) {
  const [keys, setKeys] = useState(initialKeys);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<(typeof initialKeys)[number] | null>(null);
  const [creating, setCreating] = useState(false);
  const openCreate = () => { setCreating(true); setEditing({ id: `key_${Date.now()}`, name: "", token: "创建后生成", permission: "全部模型", limit: "$50 / 月", used: "0%", created: "2026-08-07", lastUsed: "尚未使用", status: "活跃" }); };
  const saveKey = () => {
    if (!editing || !editing.name.trim()) return;
    setKeys((items) => creating ? [...items, { ...editing, token: "sk-hexbit-new-••••••71" }] : items.map((item) => item.id === editing.id ? editing : item));
    setEditing(null);
    setCreating(false);
    onNotice(creating ? "API Key 已创建，Secret 仅展示一次" : "API Key 设置已保存");
  };
  const revoke = (id: string) => setKeys((items) => items.map((item) => item.id === id ? { ...item, status: "已撤销" } : item));
  const visibleKeys = keys.filter((key) => `${key.name}${key.id}${key.permission}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="console-page">
    <PageHeader eyebrow="DEVELOPER / ACCESS CONTROL" title="API 密钥" description="为不同环境创建独立凭证，并控制模型权限与消费限额。" action="创建密钥" onAction={openCreate} />
    <div className="security-banner"><ShieldCheck size={20} /><div><b>密钥安全建议</b><span>Secret Key 仅在创建时显示一次。请使用环境变量保存，并定期轮换生产密钥。</span></div><button className="text-button" onClick={() => onNotice("已打开安全指南")}>查看指南</button></div>
    <Metrics items={[
      { label: "活跃密钥", value: String(keys.filter((key) => key.status === "活跃").length), note: `${keys.filter((key) => key.status === "已暂停").length} 个密钥已暂停`, icon: <KeyRound size={18} /> },
      { label: "今日请求", value: "18,406", note: "成功率 99.96%", icon: <Activity size={18} />, tone: "green" },
      { label: "本月调用", value: "182,406", note: "较上月 +21%", icon: <Code2 size={18} />, tone: "orange" },
      { label: "限额告警", value: "1", note: "测试环境已达限额", icon: <Zap size={18} />, tone: "purple" },
    ]} />
    <section className="panel table-panel"><div className="table-toolbar"><div><h3>密钥列表</h3><span>{visibleKeys.length} 个访问凭证</span></div><label className="search-box"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索密钥名称" /></label></div><div className="responsive-table"><div className="table-row table-head keys-table"><span>名称 / Key</span><span>模型权限</span><span>消费限额</span><span>用量</span><span>创建时间</span><span>最后使用</span><span>状态</span><span>操作</span></div>{visibleKeys.map((key) => <div className={`table-row keys-table ${key.status === "已撤销" ? "disabled-row" : ""}`} key={key.id}><div className="key-name"><strong>{key.name}</strong><code>{key.token}</code></div><span>{key.permission}</span><span>{key.limit}</span><div className="key-usage"><div className="progress"><i style={{ width: key.used }} /></div><small>{key.used}</small></div><span>{key.created}</span><span>{key.lastUsed}</span><span className={`status-label ${key.status === "活跃" ? "success" : key.status === "已暂停" ? "warning" : "neutral"}`}><i />{key.status}</span><div className="row-menu"><button title="复制密钥" onClick={() => { navigator.clipboard?.writeText(key.token); onNotice("API Key 已复制"); }}><Clipboard size={15} /></button><button title="编辑密钥" onClick={() => { setCreating(false); setEditing(key); }}><Edit3 size={15} /></button><button title="撤销密钥" disabled={key.status === "已撤销"} onClick={() => { revoke(key.id); onNotice("API Key 已撤销"); }}><Trash2 size={15} /></button></div></div>)}</div></section>
    {editing && <div className="modal-backdrop" onMouseDown={() => { setEditing(null); setCreating(false); }}><section className="edit-dialog" role="dialog" aria-modal="true" aria-label={creating ? "创建密钥" : "编辑密钥"} onMouseDown={(event) => event.stopPropagation()}><div className="dialog-head"><div><span>ACCESS CONTROL</span><h3>{creating ? "创建 API Key" : "编辑 API Key"}</h3><p>密钥权限与预算限制</p></div><button className="icon-button" onClick={() => setEditing(null)} aria-label="关闭"><X size={18} /></button></div><div className="form-grid"><label className="full">密钥名称<input autoFocus value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} placeholder="例如：生产环境" /></label><label>模型权限<select value={editing.permission} onChange={(event) => setEditing({ ...editing, permission: event.target.value })}><option>全部模型</option><option>仅文本模型</option><option>仅推理模型</option></select></label><label>每月消费限额<select value={editing.limit} onChange={(event) => setEditing({ ...editing, limit: event.target.value })}><option>$10 / 月</option><option>$50 / 月</option><option>$100 / 月</option><option>$500 / 月</option></select></label><label className="full toggle-line"><span><b>启用密钥</b><small>关闭后所有使用此密钥的请求将被拒绝</small></span><input type="checkbox" checked={editing.status === "活跃"} onChange={(event) => setEditing({ ...editing, status: event.target.checked ? "活跃" : "已暂停" })} /></label></div><div className="change-note"><ShieldCheck size={18} /><span><b>最小权限原则</b>建议为生产、测试和合作伙伴分别创建密钥，并设置独立限额。</span></div><div className="dialog-actions"><button className="secondary" onClick={() => setEditing(null)}>取消</button><button className="primary" onClick={saveKey}>{creating ? "创建密钥" : "保存变更"}</button></div></section></div>}
  </div>;
}
