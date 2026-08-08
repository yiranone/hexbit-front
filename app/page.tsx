"use client";

import { useMemo, useState } from "react";
import { ConsoleSections } from "./console-sections";
import {
  Activity,
  Bell,
  BookOpen,
  Box,
  ChevronRight,
  CircleDollarSign,
  CloudCog,
  Cpu,
  Database,
  Gauge,
  Globe2,
  Grid2X2,
  HelpCircle,
  KeyRound,
  LayoutDashboard,
  Menu,
  Network,
  Plus,
  ReceiptText,
  Server,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";

type Machine = {
  id: string;
  name: string;
  region: string;
  cpu: string;
  cores: number;
  memory: string;
  disk: string;
  network: string;
  price: number;
  stock: number;
  badge?: string;
};

const machines: Machine[] = [
  { id: "c-16", name: "Compute C16", region: "Singapore", cpu: "AMD EPYC 9354P", cores: 16, memory: "64 GB", disk: "480 GB NVMe", network: "1 Gbps", price: 0.084, stock: 12, badge: "推荐" },
  { id: "c-32", name: "Compute C32", region: "Hong Kong", cpu: "AMD EPYC 9354P", cores: 32, memory: "128 GB", disk: "960 GB NVMe", network: "2 Gbps", price: 0.158, stock: 7 },
  { id: "p-24", name: "Performance P24", region: "Tokyo", cpu: "Intel Xeon 8470", cores: 24, memory: "96 GB", disk: "1 TB NVMe", network: "2 Gbps", price: 0.139, stock: 3, badge: "高频" },
  { id: "m-8", name: "Memory M8", region: "Singapore", cpu: "AMD EPYC 9334", cores: 8, memory: "128 GB", disk: "480 GB NVMe", network: "1 Gbps", price: 0.094, stock: 9 },
  { id: "c-64", name: "Compute C64", region: "Frankfurt", cpu: "AMD EPYC 9654", cores: 64, memory: "256 GB", disk: "1.9 TB NVMe", network: "5 Gbps", price: 0.312, stock: 2, badge: "限量" },
  { id: "e-4", name: "Edge E4", region: "Los Angeles", cpu: "AMD EPYC 9174F", cores: 4, memory: "16 GB", disk: "160 GB NVMe", network: "500 Mbps", price: 0.028, stock: 18 },
];

export default function Home() {
  const [view, setView] = useState<"market" | "console">("market");
  const [locale, setLocale] = useState<"zh" | "en">("zh");
  const [languageOpen, setLanguageOpen] = useState(false);
  const [region, setRegion] = useState("all");
  const [selected, setSelected] = useState<Machine | null>(null);
  const [hours, setHours] = useState(24);
  const [paid, setPaid] = useState(false);
  const [notice, setNotice] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [chargeOpen, setChargeOpen] = useState(false);
  const [balance, setBalance] = useState(1284.5);

  const inventory = useMemo(
    () => machines.filter((m) => region === "all" || m.region === region),
    [region],
  );
  const total = selected ? (selected.price * hours).toFixed(2) : "0.00";

  const selectMachine = (machine: Machine) => {
    if (!authenticated) {
      setLoginOpen(true);
      return;
    }
    setSelected(machine);
    setPaid(false);
    setHours(24);
  };
  const openConsole = () => authenticated ? setView("console") : setLoginOpen(true);
  const signIn = () => { setAuthenticated(true); setLoginOpen(false); setNotice(en ? "Welcome to your console" : "登录成功，欢迎进入控制台"); setView("console"); };
  const en = locale === "en";
  const copy = en
    ? {
        market: "Marketplace", console: "Console", docs: "Docs", balance: "Wallet", loggedIn: "Signed in as chen@aethercpu.dev",
        hero: <>Compute power that<br /><em>keeps you moving.</em></>, heroText: "Bare-metal-grade performance for development, automation, and high-throughput services. Launch instantly. Release anytime.",
        browse: "Browse instances", enterConsole: "Open console", regions: "Global regions", uptime: "Platform uptime", delivery: "Average delivery", ready: "Instance ready",
        inventory: "Available instances", inventoryText: "Live inventory · Billed in USDT per hour", region: "Region", allRegions: "All regions", available: "available", rent: "Rent", perHour: "USDT / hour",
        featureTitle: <>From selection to SSH<br />in under a minute.</>, feature1: "Transparent inventory", feature1Text: "Live availability and configuration by region", feature2: "USDT settlement", feature2Text: "On-chain payment with automatic balance deduction", feature3: "Release anytime", feature3Text: "Destroy in seconds and stop billing immediately",
        servicesEyebrow: "TWO WAYS TO BUILD", servicesTitle: <>Infrastructure when you need control.<br /><em>Model API when you need speed.</em></>, gpuTitle: "AI Compute", gpuText: "Rent dedicated GPU capacity. Deploy, fine-tune, and operate your own models for your users.", gpuPoint1: "Full model and runtime control", gpuPoint2: "GPU instances billed by the hour", gpuAction: "Explore GPU compute", tokenTitle: "Model Token API", tokenText: "Use leading Chinese open-source LLMs through one OpenAI-compatible API. Build your own branded service and resell usage to customers.", tokenPoint1: "Qwen · DeepSeek · GLM and more", tokenPoint2: "Transparent input/output token pricing", tokenAction: "Get API key", tokenBadge: "OPENAI COMPATIBLE",
      }
    : {
        market: "算力市场", console: "控制台", docs: "开发文档", balance: "钱包", loggedIn: "已登录为 chen@aethercpu.dev",
        hero: <>把 CPU 算力<br /><em>变成你的速度。</em></>, heroText: "为研发、自动化和高并发服务提供按小时计费的裸金属级性能。创建即用，随时释放。",
        browse: "浏览实例", enterConsole: "进入控制台", regions: "全球可用区域", uptime: "平台可用性", delivery: "平均交付时间", ready: "实例已就绪",
        inventory: "可用实例", inventoryText: "实时库存 · 价格以 USDT/小时结算", region: "区域", allRegions: "全部区域", available: "台可用", rent: "租用", perHour: "USDT / 小时",
        featureTitle: <>从选配到登录，<br />不超过一分钟。</>, feature1: "透明库存", feature1Text: "实时显示每个区域的可用机器与配置", feature2: "USDT 结算", feature2Text: "支持链上付款，余额自动抵扣", feature3: "随时释放", feature3Text: "秒级销毁，停止之后不再产生实例费用",
        servicesEyebrow: "两种 AI 服务路径", servicesTitle: <>需要控制时，租用算力。<br /><em>需要速度时，直接调用模型。</em></>, gpuTitle: "AI 算力", gpuText: "租用专属 GPU 资源，自主部署、微调与运营模型，对外提供自己的 AI 服务。", gpuPoint1: "完全掌握模型与运行环境", gpuPoint2: "GPU 实例按小时计费", gpuAction: "浏览 GPU 算力", tokenTitle: "大模型 Token API", tokenText: "通过统一的 OpenAI 兼容 API 调用主流中国开源模型，搭建自有品牌服务并向客户转售用量。", tokenPoint1: "Qwen · DeepSeek · GLM 等模型", tokenPoint2: "输入/输出 Token 透明计价", tokenAction: "获取 API Key", tokenBadge: "OPENAI 兼容",
      };

  return (
    <main lang={en ? "en" : "zh-CN"}>
      {view !== "console" && <nav className="nav shell">
        <button className="brand" onClick={() => setView("market")} aria-label="返回首页">
          <img src="/hexbit-logo-primary.svg" alt="HEXBIT" width="144" height="40" />
        </button>
        <div className="nav-links">
          <button onClick={() => setView("market")} className={view === "market" ? "active" : ""}>{copy.market}</button>
          <button onClick={openConsole} className={view === "console" ? "active" : ""}>{copy.console}</button>
          <button onClick={() => setNotice(en ? "Documentation is coming soon" : "文档中心即将开放")}>{copy.docs}</button>
        </div>
        <div className="nav-actions"><div className="language-menu"><button className="language-trigger" onClick={() => setLanguageOpen((open) => !open)} aria-expanded={languageOpen}>{en ? "EN" : "中文"}<span>⌄</span></button>{languageOpen && <div className="language-popover"><button className={en ? "selected" : ""} onClick={() => { setLocale("en"); setLanguageOpen(false); }}>English</button><button className={!en ? "selected" : ""} onClick={() => { setLocale("zh"); setLanguageOpen(false); }}>中文</button></div>}</div>{authenticated && <span className="balance">{copy.balance} · {balance.toFixed(2)} USDT</span>}{authenticated ? <button className="avatar" onClick={() => setNotice(copy.loggedIn)}>CH</button> : <button className="login-link" onClick={() => setLoginOpen(true)}>{en ? "Sign in" : "登录"}</button>}</div>
      </nav>}

      {view === "market" ? (
        <>
          <section className="hero shell">
            <div className="eyebrow"><i /> ON-DEMAND COMPUTE · 2026</div>
            <h1>{copy.hero}</h1>
            <p>{copy.heroText}</p>
            <div className="hero-actions"><button className="primary" onClick={() => document.getElementById("inventory")?.scrollIntoView({ behavior: "smooth" })}>{copy.browse} <span>↓</span></button><button className="secondary" onClick={openConsole}>{copy.enterConsole}</button></div>
            <div className="hero-stats"><div><b>32</b><span>{copy.regions}</span></div><div><b>99.95%</b><span>{copy.uptime}</span></div><div><b>&lt; 60s</b><span>{copy.delivery}</span></div></div>
            <div className="orb orb-one" /><div className="orb orb-two" />
            <div className="terminal"><div className="terminal-top"><span /><span /><span /><b>{copy.ready}</b></div><code><span>$</span> ssh root@sg-c16-048.aethercpu.net<br /><small>Welcome to HEXBIT Compute · Ubuntu 24.04 LTS</small><br /><span>$</span> <i>_</i></code></div>
          </section>

          <section id="inventory" className="market shell">
            <div className="section-head"><div><span className="eyebrow"><i /> LIVE INVENTORY</span><h2>{copy.inventory}</h2><p>{copy.inventoryText}</p></div><div className="filters"><label>{copy.region}</label><select value={region} onChange={(e) => setRegion(e.target.value)}><option value="all">{copy.allRegions}</option><option>Singapore</option><option>Hong Kong</option><option>Tokyo</option><option>Frankfurt</option><option>Los Angeles</option></select></div></div>
            <div className="machine-grid">
              {inventory.map((m) => <article className="machine" key={m.id}>
                <div className="machine-top"><span className="availability"><i /> {m.stock} {copy.available}</span>{m.badge && <span className="tag">{m.badge}</span>}</div>
                <h3>{m.name}</h3><p className="machine-region">⌖ {m.region} · {m.cpu}</p>
                <div className="specs"><span><b>{m.cores}</b> vCPU</span><span><b>{m.memory}</b> RAM</span><span><b>{m.disk}</b> NVMe</span><span><b>{m.network}</b> 网络</span></div>
                <div className="machine-bottom"><div><strong>${m.price.toFixed(3)}</strong><small> {copy.perHour}</small></div><button onClick={() => selectMachine(m)} disabled={!m.stock}>{copy.rent} →</button></div>
              </article>)}
            </div>
          </section>

          <section className="services shell">
            <div className="services-head"><span className="eyebrow"><i /> {copy.servicesEyebrow}</span><h2>{copy.servicesTitle}</h2></div>
            <div className="service-grid">
              <article className="service-card compute-card"><div className="service-icon">◌</div><h3>{copy.gpuTitle}</h3><p>{copy.gpuText}</p><ul><li>{copy.gpuPoint1}</li><li>{copy.gpuPoint2}</li></ul><button className="secondary" onClick={() => document.getElementById("inventory")?.scrollIntoView({ behavior: "smooth" })}>{copy.gpuAction} →</button></article>
              <article className="service-card token-card"><div className="token-card-top"><span className="token-badge">{copy.tokenBadge}</span><span className="service-icon">⌁</span></div><h3>{copy.tokenTitle}</h3><p>{copy.tokenText}</p><ul><li>{copy.tokenPoint1}</li><li>{copy.tokenPoint2}</li></ul><div className="api-code"><span>POST</span> /v1/chat/completions<br /><small>model: qwen-plus</small></div><button className="primary" onClick={() => setNotice(en ? "API key application is coming soon" : "API Key 申请即将开放")}>{copy.tokenAction} →</button></article>
            </div>
          </section>

          <section className="features shell"><div><span className="eyebrow"><i /> BUILT FOR VELOCITY</span><h2>{copy.featureTitle}</h2></div><div className="feature-list"><p><b>01</b><span>{copy.feature1}</span><small>{copy.feature1Text}</small></p><p><b>02</b><span>{copy.feature2}</span><small>{copy.feature2Text}</small></p><p><b>03</b><span>{copy.feature3}</span><small>{copy.feature3Text}</small></p></div></section>
        </>
      ) : <DashboardConsole onNotice={setNotice} onRent={() => setView("market")} onCharge={() => setChargeOpen(true)} balance={balance} />}

      {selected && <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelected(null)}><section className="checkout" role="dialog" aria-modal="true" aria-label="创建实例" onMouseDown={(e) => e.stopPropagation()}>
        <button className="close" onClick={() => setSelected(null)}>×</button>
        {!paid ? <><span className="eyebrow"><i /> NEW INSTANCE</span><h2>确认租用配置</h2><div className="order-machine"><b>{selected.name}</b><span>⌖ {selected.region} · {selected.cores} vCPU · {selected.memory}</span></div><label className="field">租用时长 <div className="stepper"><button onClick={() => setHours(Math.max(1, hours - 1))}>−</button><b>{hours} 小时</b><button onClick={() => setHours(hours + 1)}>+</button></div></label><div className="payment"><div><span>支付方式</span><b>₮ USDT · TRC20</b></div><button>切换</button></div><div className="total"><span>订单总计</span><strong>{total} <small>USDT</small></strong></div><button className="primary wide" onClick={() => setPaid(true)}>确认并支付 {total} USDT</button><p className="muted">演示原型：付款不会发起真实链上交易。</p></> : <div className="success"><div className="check">✓</div><span className="eyebrow"><i /> PAYMENT CONFIRMED</span><h2>实例正在开通</h2><p>预计 42 秒后可通过 SSH 登录。详情会出现在控制台的「实例管理」中。</p><button className="primary wide" onClick={() => { setSelected(null); setView("console"); }}>查看实例控制台 →</button></div>}
      </section></div>}
      {notice && <div className="toast">{notice}<button onClick={() => setNotice("")}>×</button></div>}
      {loginOpen && <div className="modal-backdrop"><section className="auth-card" role="dialog" aria-modal="true" aria-label="登录"><button className="close" onClick={() => setLoginOpen(false)}>×</button><span className="eyebrow"><i /> HEXBITCPU CONSOLE</span><h2>{en ? "Sign in to your console" : "登录控制台"}</h2><p>{en ? "Manage servers, balance and model API usage in one workspace." : "在一个工作台中管理服务器、余额和模型 API 用量。"}</p><label>{en ? "Email" : "邮箱"}<input type="email" placeholder="name@company.com" defaultValue="chen@aethercpu.dev" /></label><label>{en ? "Password" : "密码"}<input type="password" placeholder="••••••••" defaultValue="demo-password" /></label><button className="primary wide" onClick={signIn}>{en ? "Sign in" : "登录"} →</button><small>{en ? "Demo mode — no real account is required." : "演示模式，无需真实账户。"}</small></section></div>}
      {chargeOpen && <div className="modal-backdrop"><section className="auth-card charge-card" role="dialog" aria-modal="true" aria-label="充值"><button className="close" onClick={() => setChargeOpen(false)}>×</button><span className="eyebrow"><i /> WALLET TOP-UP</span><h2>{en ? "Add USDT balance" : "充值 USDT"}</h2><p>{en ? "Choose an amount. This demo will update your console balance immediately." : "选择充值金额。演示模式会立即更新控制台余额。"}</p><div className="amount-grid">{[100, 500, 1000].map((amount) => <button key={amount} onClick={() => { setBalance((value) => value + amount); setChargeOpen(false); setNotice(en ? `${amount} USDT added to your wallet` : `已充值 ${amount} USDT`); }}>{amount} USDT</button>)}</div><div className="wallet-address">TRC20<br /><b>TWv...hexbit...9kP</b></div></section></div>}
    </main>
  );
}

function DashboardConsole({ onNotice, onRent, onCharge, balance }: { onNotice: (value: string) => void; onRent: () => void; onCharge: () => void; balance: number }) {
  const [section, setSection] = useState("首页");
  const navItems = [
    { label: "首页", icon: LayoutDashboard },
    { label: "模型 API", icon: Sparkles },
    { label: "GPU 服务器", icon: Cpu },
    { label: "实例管理", icon: Server },
    { label: "资源中心", icon: Database },
    { label: "云监控", icon: Activity },
    { label: "用量与账单", icon: ReceiptText },
    { label: "API 密钥", icon: KeyRound },
  ];

  return <section className="dashboard">
    <aside className="dashboard-side">
      <img className="side-logo-full" src="/hexbit-logo-primary.svg" alt="HEXBIT" />
      <img className="side-logo-mark" src="/hexbit-mark.svg" alt="" />
      <div className="side-nav">{navItems.map(({ label, icon: Icon }) => <button key={label} className={section === label ? "active" : ""} onClick={() => setSection(label)}><Icon size={17} />{label}<ChevronRight size={15} /></button>)}</div>
      <div className="side-bottom"><button onClick={onCharge}><WalletCards size={17} />财务与充值<ChevronRight size={15} /></button><button onClick={() => onNotice("已打开帮助中心")}><HelpCircle size={17} />帮助中心</button></div>
    </aside>
    <div className="dashboard-work">
      <header className="dashboard-top">
        <div className="console-context"><button className="top-icon" aria-label="展开菜单"><Menu size={19} /></button><span>区域</span><button className="region-select"><Globe2 size={15} />中国重庆二区</button></div>
        <nav className="top-links"><button onClick={() => setSection("用量与账单")}>费用</button><button onClick={() => setSection("资源中心")}>资源</button><button onClick={() => onNotice("已打开用户与权限")}>用户</button><button onClick={() => onNotice("已打开文档中心")}>文档</button></nav>
        <div className="top-actions"><button className="agent-pill"><Sparkles size={14} />AI 助手</button><button className="top-icon" aria-label="通知" onClick={() => onNotice("暂无新通知")}><Bell size={18} /></button><button className="wallet-pill" onClick={onCharge}><CircleDollarSign size={15} />{balance.toFixed(2)} USDT</button><button className="profile" title="zhejiangshengwang">ZW</button></div>
      </header>
      <main className="dashboard-content">{section === "首页" ? <ConsoleHome balance={balance} onCharge={onCharge} onNotice={onNotice} onRent={onRent} setSection={setSection} /> : <ConsoleSections section={section} onRent={onRent} onCharge={onCharge} onNotice={onNotice} balance={balance} />}</main>
    </div>
  </section>;
}

function ConsoleHome({ balance, onCharge, onNotice, onRent, setSection }: { balance: number; onCharge: () => void; onNotice: (value: string) => void; onRent: () => void; setSection: (value: string) => void }) {
  const quickLinks = [
    ["弹性裸金属 BMS", Server], ["费用与成本", ReceiptText], ["高性能算力池", Cpu],
    ["资源管理", Grid2X2], ["数据管理平台", Database], ["弹性计算集群", CloudCog],
  ] as const;
  const messages = [
    ["资源到期提醒", "prod-inference-01 将于 3 天后到期", "今天 09:42"],
    ["续订状态提醒", "自动续订失败，请检查账户余额", "今天 08:16"],
    ["平台消息", "重庆二区网络维护已完成", "昨天 23:40"],
  ];

  return <div className="console-home">
    <div className="home-title"><div><p>CONSOLE OVERVIEW</p><h1>下午好，zhejiangshengwang</h1><span>资源、费用与告警状态已更新</span></div><button className="primary" onClick={onRent}><Plus size={16} />创建资源</button></div>
    <div className="home-layout">
      <div className="home-main">
        <section className="panel quick-panel"><div className="panel-title"><div><h2>最近访问</h2><p>常用云服务与管理入口</p></div><button className="text-button" onClick={() => onNotice("自定义入口已打开")}>自定义</button></div><div className="quick-links">{quickLinks.map(([label, Icon]) => <button key={label} onClick={() => label.includes("费用") ? setSection("用量与账单") : label.includes("资源管理") || label.includes("数据管理") ? setSection("资源中心") : label.includes("算力") || label.includes("计算") ? setSection("GPU 服务器") : onNotice(`已打开${label}`)}><Icon size={17} /><span>{label}</span><ChevronRight size={14} /></button>)}</div></section>
        <section className="service-banner"><div><span>MODELSTUDIO</span><h2>模型开发与推理服务已升级</h2><p>统一管理模型 API、GPU 算力和实例资源。</p></div><button onClick={() => setSection("模型 API")}>立即体验<ChevronRight size={15} /></button></section>
        <section className="panel service-overview"><div className="panel-title"><div><h2>我的服务</h2><p>云资源运行概览</p></div><button className="text-button" onClick={() => setSection("云监控")}>查看全部</button></div><div className="service-body"><div className="service-map"><div className="map-grid">{Array.from({ length: 12 }).map((_, index) => <i key={index} className={index === 6 ? "active" : index === 9 ? "warning" : ""}><Box size={16} /></i>)}</div><div className="map-legend"><span><i />已拥有</span><span><i />未拥有</span><span><i />待续费</span></div></div><div className="service-detail"><div className="service-detail-head"><div className="service-logo"><Gauge size={22} /></div><div><h3>云监控服务 CMS</h3><span className="status-label success"><i />运行正常</span></div></div><p>从基础设施、系统服务与运行任务等维度监控云资源，集中查看状态与告警。</p><div className="service-actions"><button className="secondary" onClick={() => setSection("云监控")}>查看详情</button><button className="primary" onClick={() => setSection("云监控")}>前往控制台</button></div><div className="related-services"><span>关联产品</span><button>文件存储 AFS</button><button>对象存储 AOSS</button><button>云服务器 CCI</button></div></div></div></section>
        <section className="panel resource-panel"><div className="panel-title"><div><h2>我的资源</h2><p>当前区域资源状态</p></div><button className="text-button" onClick={() => setSection("资源中心")}>资源管理</button></div><div className="resource-grid"><article><div><Globe2 size={19} /><span>弹性公网 IP</span></div><b>1</b><small>实例 · 100 Mbps 带宽</small></article><article><div><Network size={19} /><span>私有网络 VPC</span></div><b>1</b><small>21 个子网 · 全部正常</small></article><article><div><Server size={19} /><span>计算实例</span></div><b>3</b><small>2 个运行中 · 1 个已停止</small></article><article><div><Database size={19} /><span>存储卷</span></div><b>4</b><small>2.4 TiB 已分配</small></article></div></section>
      </div>
      <aside className="home-rail">
        <section className="panel account-panel"><button className="panel-link" onClick={() => onNotice("已打开账号中心")}>账号中心<ChevronRight size={14} /></button><div className="account-row"><div className="account-avatar">ZW</div><div><b>zhejiangshengwang</b><span>线下签约 · 根用户</span></div></div><p>企业标识：<strong>zhejiangshengwang</strong></p><div className="account-key"><span>访问密钥</span><b>1 / 1</b><button onClick={() => setSection("API 密钥")}>管理</button></div></section>
        <section className="panel finance-panel"><button className="panel-link" onClick={() => setSection("用量与账单")}>费用中心<ChevronRight size={14} /></button><span>可用余额</span><strong>{balance.toFixed(2)} <small>USDT</small></strong><button className="primary" onClick={onCharge}>充值</button><div className="finance-stats"><div><b className="danger">1</b><span>超期订单</span></div><div><b>0</b><span>即将到期</span></div><div><b>0</b><span>待支付</span></div></div></section>
        <section className="panel alerts-panel"><button className="panel-link" onClick={() => onNotice("已打开告警规则")}>资源预警<ChevronRight size={14} /></button><div className="alert-stats"><div><b>0</b><span>紧急告警</span></div><div><b>0</b><span>重要告警</span></div><div><b>0</b><span>近 7 天</span></div></div><div className="health-line"><ShieldCheck size={17} /><span>所有监控项运行正常</span></div></section>
        <section className="panel message-panel"><div className="panel-title"><div><h2>产品消息</h2><p>最近通知</p></div><button className="text-button" onClick={() => onNotice("已打开消息中心")}>全部</button></div><div className="message-list">{messages.map(([type, text, time]) => <button key={text} onClick={() => onNotice(text)}><i /><span><b>{type}</b><small>{text}</small><time>{time}</time></span></button>)}</div></section>
        <section className="support-row"><button onClick={() => onNotice("已打开帮助文档")}><BookOpen size={17} />帮助文档</button><button onClick={() => onNotice("已打开服务支持")}><Activity size={17} />服务支持</button></section>
      </aside>
    </div>
  </div>;
}
