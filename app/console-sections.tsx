"use client";

import { useMemo, useState } from "react";
import {
  Activity,
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
  MoreHorizontal,
  Network,
  Plus,
  Power,
  ReceiptText,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
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
};

type Instance = {
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

const initialInstances: Instance[] = [
  { id: "ins-sg-7F28", name: "prod-inference-01", status: "运行中", region: "Singapore", zone: "ap-sg-1a", spec: "RTX 4090 · 16C 64G", disk: "NVMe 480 GiB", os: "Ubuntu 24.04", publicIp: "103.28.74.16", privateIp: "10.14.2.8", billing: "按量计费", price: "$0.420/h" },
  { id: "ins-hk-2A91", name: "qwen-finetune", status: "运行中", region: "Hong Kong", zone: "ap-hk-1b", spec: "A100 80G · 24C 180G", disk: "SSD 1.2 TiB", os: "PyTorch 2.5", publicIp: "45.124.68.31", privateIp: "10.21.4.12", billing: "包月", price: "$568.00/mo" },
  { id: "ins-tk-9C04", name: "dev-notebook", status: "已停止", region: "Tokyo", zone: "ap-tk-1a", spec: "L40S 48G · 20C 96G", disk: "SSD 320 GiB", os: "Ubuntu 22.04", publicIp: "未绑定", privateIp: "10.31.8.6", billing: "按量计费", price: "$0.720/h" },
];

const initialKeys = [
  { id: "key_01", name: "生产环境", token: "sk-hexbit-prod-••••••12", permission: "全部模型", limit: "$500 / 月", used: "61%", created: "2026-07-18", lastUsed: "2 分钟前", status: "活跃" },
  { id: "key_02", name: "合作伙伴 Acme", token: "sk-hexbit-acme-••••••89", permission: "仅文本模型", limit: "$100 / 月", used: "24%", created: "2026-07-29", lastUsed: "3 小时前", status: "活跃" },
  { id: "key_03", name: "测试环境", token: "sk-hexbit-test-••••••44", permission: "全部模型", limit: "$10 / 月", used: "100%", created: "2026-08-02", lastUsed: "昨天", status: "已暂停" },
];

export function ConsoleSections(props: ConsoleSectionsProps) {
  if (props.section === "模型 API") return <ModelsPage {...props} />;
  if (props.section === "GPU 服务器") return <GpuPage {...props} />;
  if (props.section === "实例管理") return <InstancesPage {...props} />;
  if (props.section === "用量与账单") return <BillingPage {...props} />;
  return <KeysPage {...props} />;
}

function PageHeader({ eyebrow, title, description, action, onAction }: { eyebrow: string; title: string; description: string; action: string; onAction: () => void }) {
  return <div className="console-page-head"><div><span>{eyebrow}</span><h2>{title}</h2><p>{description}</p></div><button className="primary" onClick={onAction}><Plus size={16} />{action}</button></div>;
}

function Metrics({ items }: { items: Array<{ label: string; value: string; note: string; icon: React.ReactNode; tone?: string }> }) {
  return <div className="console-metrics">{items.map((item) => <article key={item.label}><div className={`metric-icon ${item.tone ?? ""}`}>{item.icon}</div><div><span>{item.label}</span><b>{item.value}</b><small>{item.note}</small></div></article>)}</div>;
}

function ModelsPage({ onNotice, onCharge }: ConsoleSectionsProps) {
  const [category, setCategory] = useState("全部模型");
  const [search, setSearch] = useState("");
  const filtered = modelRows.filter((model) => (category === "全部模型" || model.type === category) && model.name.toLowerCase().includes(search.toLowerCase()));
  return <div className="console-page">
    <PageHeader eyebrow="AI STUDIO / MODEL API" title="模型 API" description="通过统一的 OpenAI 兼容端点调用模型，按实际 Token 用量结算。" action="创建 API Key" onAction={() => onNotice("已打开 API Key 创建流程")} />
    <Metrics items={[
      { label: "本月 Token", value: "24.8M", note: "较上月 +12.4%", icon: <Activity size={18} /> },
      { label: "本月费用", value: "$18.62", note: "预算使用 37%", icon: <CircleDollarSign size={18} />, tone: "green" },
      { label: "成功率", value: "99.92%", note: "过去 30 天", icon: <Gauge size={18} />, tone: "orange" },
      { label: "可用模型", value: "12", note: "4 家模型提供商", icon: <Code2 size={18} />, tone: "purple" },
    ]} />
    <div className="console-split model-overview"><section className="panel model-usage"><div className="panel-title"><div><h3>用量趋势</h3><p>过去 7 天 · 百万 Token</p></div><button className="text-button">查看明细</button></div><div className="bar-chart">{[42, 58, 48, 72, 66, 84, 61].map((height, index) => <div key={index}><i style={{ height: `${height}%` }} /><span>{["五", "六", "日", "一", "二", "三", "四"][index]}</span></div>)}</div></section><section className="panel endpoint-card"><div className="panel-title"><div><h3>API 接入</h3><p>OpenAI SDK 无缝迁移</p></div><button className="icon-button" title="复制端点" onClick={() => onNotice("API 端点已复制")}><Clipboard size={16} /></button></div><code>https://api.hexbit.ai/v1</code><div className="endpoint-meta"><span><Check size={14} />兼容 Chat Completions</span><span><ShieldCheck size={14} />TLS 加密</span></div><button className="secondary compact" onClick={onCharge}>查看接入文档</button></section></div>
    <section className="panel table-panel"><div className="table-toolbar"><div><h3>模型目录</h3><span>{filtered.length} 个可用模型</span></div><div className="segmented">{["全部模型", "文本生成", "推理增强", "工具调用"].map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div><label className="search-box"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索模型" /></label></div><div className="responsive-table"><div className="table-row table-head models-table"><span>模型</span><span>类型</span><span>上下文</span><span>输入 / 1M</span><span>输出 / 1M</span><span>平均延迟</span><span>状态</span><span /></div>{filtered.map((model) => <div className="table-row models-table" key={model.name}><div className="model-name"><b>{model.mark}</b><span><strong>{model.name}</strong><small>{model.provider}</small></span></div><span>{model.type}</span><span>{model.context}</span><span>{model.input}</span><span>{model.output}</span><span>{model.latency}</span><span className={`status-label ${model.status === "稳定" ? "success" : "warning"}`}><i />{model.status}</span><button className="outline-button" onClick={() => onNotice(`已选择 ${model.name}`)}>调用</button></div>)}</div></section>
  </div>;
}

function GpuPage({ onRent, onNotice }: ConsoleSectionsProps) {
  const [billing, setBilling] = useState("按量计费");
  const [region, setRegion] = useState("全部区域");
  return <div className="console-page">
    <PageHeader eyebrow="COMPUTE / GPU MARKET" title="GPU 服务器" description="按工作负载选择 GPU，支持虚拟机、裸金属和竞价实例。" action="创建服务器" onAction={onRent} />
    <div className="availability-strip"><span><Zap size={18} />实时库存</span><div><b>39</b> 张 GPU 可立即部署</div><small>库存更新于 12 秒前</small><button className="icon-button" title="刷新库存" onClick={() => onNotice("库存已刷新")}><RefreshCw size={15} /></button></div>
    <section className="panel table-panel"><div className="table-toolbar gpu-toolbar"><div className="segmented">{["按量计费", "包月", "竞价实例"].map((item) => <button key={item} className={billing === item ? "active" : ""} onClick={() => setBilling(item)}>{item}</button>)}</div><div className="toolbar-actions"><label className="select-control"><Network size={15} /><select value={region} onChange={(event) => setRegion(event.target.value)}><option>全部区域</option><option>Singapore</option><option>Hong Kong</option><option>Tokyo</option></select><ChevronDown size={14} /></label><button className="outline-button"><Filter size={14} />更多筛选</button></div></div><div className="responsive-table"><div className="table-row table-head gpu-table"><span>GPU 型号</span><span>计算配置</span><span>区域 / 可用区</span><span>库存</span><span>{billing === "包月" ? "包月单价" : "按量单价"}</span><span>长期价格</span><span /></div>{gpuRows.filter((gpu) => region === "全部区域" || gpu.region.startsWith(region)).map((gpu) => <div className="table-row gpu-table" key={gpu.name}><div className="gpu-name"><span className="gpu-mark">GPU</span><span><strong>{gpu.name}</strong><small>{gpu.vram}</small></span></div><span>{gpu.compute}</span><span>{gpu.region}</span><span className="stock"><i />{gpu.stock} 可用</span><strong>{billing === "包月" ? gpu.monthly : gpu.ondemand}<small> / GPU / 时</small></strong><span>{gpu.monthly}<small className="saving">{gpu.saving}</small></span><button className="primary compact" onClick={onRent}>部署</button></div>)}</div></section>
    <div className="resource-notes"><article><HardDrive size={19} /><div><b>块存储</b><span>从 $0.0002 / GiB / 小时</span></div></article><article><Network size={19} /><div><b>公网与 VPC</b><span>共享带宽免费，独享带宽按量</span></div></article><article><ShieldCheck size={19} /><div><b>安全组</b><span>默认拒绝入站，可绑定 4 个规则组</span></div></article></div>
  </div>;
}

function InstancesPage({ onRent, onNotice }: ConsoleSectionsProps) {
  const [instances, setInstances] = useState(initialInstances);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("全部状态");
  const [editing, setEditing] = useState<Instance | null>(null);
  const visible = useMemo(() => instances.filter((instance) => (status === "全部状态" || instance.status === status) && `${instance.name}${instance.id}${instance.publicIp}`.toLowerCase().includes(query.toLowerCase())), [instances, query, status]);
  const togglePower = (id: string) => setInstances((items) => items.map((item) => item.id === id ? { ...item, status: item.status === "运行中" ? "已停止" : "运行中" } : item));
  const saveInstance = () => {
    if (!editing) return;
    setInstances((items) => items.map((item) => item.id === editing.id ? editing : item));
    setEditing(null);
    onNotice("实例配置已保存");
  };
  return <div className="console-page">
    <PageHeader eyebrow="COMPUTE / INSTANCES" title="实例管理" description="查看服务器状态、网络、镜像与计费信息，并执行日常运维操作。" action="新建实例" onAction={onRent} />
    <Metrics items={[
      { label: "实例总数", value: "3", note: "2 个区域", icon: <Server size={18} /> },
      { label: "运行中", value: "2", note: "资源使用正常", icon: <Activity size={18} />, tone: "green" },
      { label: "GPU 使用率", value: "72%", note: "平均值", icon: <Gauge size={18} />, tone: "orange" },
      { label: "预计本月", value: "$186.42", note: "较预算低 18%", icon: <CircleDollarSign size={18} />, tone: "purple" },
    ]} />
    <section className="panel table-panel"><div className="table-toolbar"><div className="toolbar-actions"><label className="search-box wide-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索名称、实例 ID 或 IP" /></label><label className="select-control"><Filter size={15} /><select value={status} onChange={(event) => setStatus(event.target.value)}><option>全部状态</option><option>运行中</option><option>已停止</option></select><ChevronDown size={14} /></label></div><div className="toolbar-actions"><button className="outline-button"><Download size={14} />导出</button><button className="icon-button" title="刷新列表" onClick={() => onNotice("实例状态已刷新")}><RefreshCw size={15} /></button></div></div><div className="responsive-table"><div className="table-row table-head instance-table"><span>实例名称 / ID</span><span>状态</span><span>区域 / 可用区</span><span>规格与磁盘</span><span>系统镜像</span><span>公网 / 私网 IP</span><span>计费</span><span>操作</span></div>{visible.map((instance) => <div className="table-row instance-table" key={instance.id}><div className="instance-name"><strong>{instance.name}</strong><small>{instance.id}</small></div><span className={`status-label ${instance.status === "运行中" ? "success" : "neutral"}`}><i />{instance.status}</span><span>{instance.region}<small>{instance.zone}</small></span><span>{instance.spec}<small>{instance.disk}</small></span><span>{instance.os}</span><span className="ip-cell"><code>{instance.publicIp}</code><small>{instance.privateIp}</small></span><span>{instance.billing}<small>{instance.price}</small></span><div className="row-menu"><button title="启动或停止" onClick={() => { togglePower(instance.id); onNotice(instance.status === "运行中" ? "实例已停止" : "实例已启动"); }}><Power size={15} /></button><button title="编辑实例" onClick={() => setEditing(instance)}><Edit3 size={15} /></button><button title="更多操作"><MoreHorizontal size={16} /></button></div></div>)}</div></section>
    {editing && <div className="modal-backdrop" onMouseDown={() => setEditing(null)}><section className="edit-dialog" role="dialog" aria-modal="true" aria-label="编辑实例" onMouseDown={(event) => event.stopPropagation()}><div className="dialog-head"><div><span>INSTANCE SETTINGS</span><h3>编辑实例</h3><p>{editing.id}</p></div><button className="icon-button" onClick={() => setEditing(null)} aria-label="关闭"><X size={18} /></button></div><div className="form-grid"><label className="full">实例名称<input value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} /></label><label>计费方式<select value={editing.billing} onChange={(event) => setEditing({ ...editing, billing: event.target.value })}><option>按量计费</option><option>包月</option></select></label><label>系统镜像<select value={editing.os} onChange={(event) => setEditing({ ...editing, os: event.target.value })}><option>Ubuntu 24.04</option><option>Ubuntu 22.04</option><option>PyTorch 2.5</option></select></label><label className="full">实例规格<select value={editing.spec} onChange={(event) => setEditing({ ...editing, spec: event.target.value })}><option>RTX 4090 · 16C 64G</option><option>A100 80G · 24C 180G</option><option>L40S 48G · 20C 96G</option></select></label></div><div className="change-note"><CloudCog size={18} /><span><b>配置变更说明</b>运行中的实例变配需要短暂停机，新配置将在重启后生效。</span></div><div className="dialog-actions"><button className="secondary" onClick={() => setEditing(null)}>取消</button><button className="primary" onClick={saveInstance}>保存变更</button></div></section></div>}
  </div>;
}

function BillingPage({ balance, onCharge, onNotice }: ConsoleSectionsProps) {
  const [range, setRange] = useState("本月");
  const bills = [
    ["2026-08-07 10:00", "GPU 云服务器", "prod-inference-01", "按量计费 · 1 小时", "-$0.42"],
    ["2026-08-07 09:00", "模型 API", "Qwen3-235B-A22B", "输入 1.8M · 输出 0.4M", "-$0.61"],
    ["2026-08-07 08:00", "块存储", "vol-sg-0291", "480 GiB · 1 小时", "-$0.10"],
    ["2026-08-06 18:32", "账户充值", "TRC20 · 已确认", "交易 0xb21...8e4", "+$500.00"],
    ["2026-08-06 16:00", "GPU 云服务器", "qwen-finetune", "包月续费", "-$568.00"],
  ];
  return <div className="console-page">
    <PageHeader eyebrow="FINANCE / BILLING" title="用量与账单" description="按产品、资源和时间查看成本，跟踪余额与预算执行情况。" action="充值 USDT" onAction={onCharge} />
    <Metrics items={[
      { label: "可用余额", value: `${balance.toFixed(2)} USDT`, note: "预计可用 36 天", icon: <CircleDollarSign size={18} />, tone: "green" },
      { label: "本月消费", value: "$186.42", note: "较上月 +8.2%", icon: <ReceiptText size={18} /> },
      { label: "本月预算", value: "$500.00", note: "已使用 37.3%", icon: <Gauge size={18} />, tone: "orange" },
      { label: "待出账", value: "$12.86", note: "下一账期 09:00", icon: <RefreshCw size={18} />, tone: "purple" },
    ]} />
    <div className="console-split billing-overview"><section className="panel spend-chart"><div className="panel-title"><div><h3>消费趋势</h3><p>按日汇总 · USDT</p></div><div className="segmented small">{["7 天", "本月", "上月"].map((item) => <button key={item} className={range === item ? "active" : ""} onClick={() => setRange(item)}>{item}</button>)}</div></div><div className="line-chart"><div className="chart-grid"><span>$40</span><span>$30</span><span>$20</span><span>$10</span></div><svg viewBox="0 0 600 160" preserveAspectRatio="none" aria-label="消费趋势图"><path className="area" d="M0 135 L85 112 L170 123 L255 76 L340 91 L425 44 L510 62 L600 28 L600 160 L0 160 Z" /><path className="line" d="M0 135 L85 112 L170 123 L255 76 L340 91 L425 44 L510 62 L600 28" /></svg><div className="chart-labels"><span>08/01</span><span>08/03</span><span>08/05</span><span>08/07</span></div></div></section><section className="panel cost-breakdown"><div className="panel-title"><div><h3>产品占比</h3><p>本月费用构成</p></div></div>{[["GPU 云服务器", "68%", "$126.77"], ["模型 API", "22%", "$41.01"], ["存储与网络", "10%", "$18.64"]].map(([name, width, value], index) => <div className="breakdown-row" key={name}><div><span><i className={`cost-color c${index}`} />{name}</span><b>{value}</b></div><div className="progress"><i className={`c${index}`} style={{ width }} /></div><small>{width}</small></div>)}</section></div>
    <section className="panel table-panel"><div className="table-toolbar"><div><h3>交易明细</h3><span>实时更新的资源消费与充值记录</span></div><div className="toolbar-actions"><button className="outline-button"><Filter size={14} />全部产品</button><button className="outline-button" onClick={() => onNotice("账单文件已准备下载")}><Download size={14} />导出账单</button></div></div><div className="responsive-table"><div className="table-row table-head billing-table"><span>时间</span><span>产品</span><span>资源</span><span>计费详情</span><span>金额</span><span>状态</span></div>{bills.map(([date, product, resource, detail, amount]) => <div className="table-row billing-table" key={`${date}${resource}`}><span>{date}</span><span>{product}</span><strong>{resource}</strong><span>{detail}</span><b className={amount.startsWith("+") ? "positive" : ""}>{amount}</b><span className="status-label success"><i />已结算</span></div>)}</div></section>
  </div>;
}

function KeysPage({ onNotice }: ConsoleSectionsProps) {
  const [keys, setKeys] = useState(initialKeys);
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
  return <div className="console-page">
    <PageHeader eyebrow="DEVELOPER / ACCESS CONTROL" title="API 密钥" description="为不同环境创建独立凭证，并控制模型权限与消费限额。" action="创建密钥" onAction={openCreate} />
    <div className="security-banner"><ShieldCheck size={20} /><div><b>密钥安全建议</b><span>Secret Key 仅在创建时显示一次。请使用环境变量保存，并定期轮换生产密钥。</span></div><button className="text-button" onClick={() => onNotice("已打开安全指南")}>查看指南</button></div>
    <Metrics items={[
      { label: "活跃密钥", value: "2", note: "1 个密钥已暂停", icon: <KeyRound size={18} /> },
      { label: "今日请求", value: "18,406", note: "成功率 99.96%", icon: <Activity size={18} />, tone: "green" },
      { label: "本月调用", value: "182,406", note: "较上月 +21%", icon: <Code2 size={18} />, tone: "orange" },
      { label: "限额告警", value: "1", note: "测试环境已达限额", icon: <Zap size={18} />, tone: "purple" },
    ]} />
    <section className="panel table-panel"><div className="table-toolbar"><div><h3>密钥列表</h3><span>{keys.length} 个访问凭证</span></div><label className="search-box"><Search size={15} /><input placeholder="搜索密钥名称" /></label></div><div className="responsive-table"><div className="table-row table-head keys-table"><span>名称 / Key</span><span>模型权限</span><span>消费限额</span><span>用量</span><span>创建时间</span><span>最后使用</span><span>状态</span><span>操作</span></div>{keys.map((key) => <div className={`table-row keys-table ${key.status === "已撤销" ? "disabled-row" : ""}`} key={key.id}><div className="key-name"><strong>{key.name}</strong><code>{key.token}</code></div><span>{key.permission}</span><span>{key.limit}</span><div className="key-usage"><div className="progress"><i style={{ width: key.used }} /></div><small>{key.used}</small></div><span>{key.created}</span><span>{key.lastUsed}</span><span className={`status-label ${key.status === "活跃" ? "success" : key.status === "已暂停" ? "warning" : "neutral"}`}><i />{key.status}</span><div className="row-menu"><button title="复制密钥" onClick={() => onNotice("API Key 已复制")}><Clipboard size={15} /></button><button title="编辑密钥" onClick={() => { setCreating(false); setEditing(key); }}><Edit3 size={15} /></button><button title="撤销密钥" disabled={key.status === "已撤销"} onClick={() => { revoke(key.id); onNotice("API Key 已撤销"); }}><Trash2 size={15} /></button></div></div>)}</div></section>
    {editing && <div className="modal-backdrop" onMouseDown={() => { setEditing(null); setCreating(false); }}><section className="edit-dialog" role="dialog" aria-modal="true" aria-label={creating ? "创建密钥" : "编辑密钥"} onMouseDown={(event) => event.stopPropagation()}><div className="dialog-head"><div><span>ACCESS CONTROL</span><h3>{creating ? "创建 API Key" : "编辑 API Key"}</h3><p>密钥权限与预算限制</p></div><button className="icon-button" onClick={() => setEditing(null)} aria-label="关闭"><X size={18} /></button></div><div className="form-grid"><label className="full">密钥名称<input autoFocus value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} placeholder="例如：生产环境" /></label><label>模型权限<select value={editing.permission} onChange={(event) => setEditing({ ...editing, permission: event.target.value })}><option>全部模型</option><option>仅文本模型</option><option>仅推理模型</option></select></label><label>每月消费限额<select value={editing.limit} onChange={(event) => setEditing({ ...editing, limit: event.target.value })}><option>$10 / 月</option><option>$50 / 月</option><option>$100 / 月</option><option>$500 / 月</option></select></label><label className="full toggle-line"><span><b>启用密钥</b><small>关闭后所有使用此密钥的请求将被拒绝</small></span><input type="checkbox" checked={editing.status === "活跃"} onChange={(event) => setEditing({ ...editing, status: event.target.checked ? "活跃" : "已暂停" })} /></label></div><div className="change-note"><ShieldCheck size={18} /><span><b>最小权限原则</b>建议为生产、测试和合作伙伴分别创建密钥，并设置独立限额。</span></div><div className="dialog-actions"><button className="secondary" onClick={() => setEditing(null)}>取消</button><button className="primary" onClick={saveKey}>{creating ? "创建密钥" : "保存变更"}</button></div></section></div>}
  </div>;
}
