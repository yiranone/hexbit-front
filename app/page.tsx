"use client";

import { useMemo, useState } from "react";

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

const statusItems = [
  ["运行中实例", "3", "+1 本周"],
  ["可用余额", "1,284.50", "USDT"],
  ["本月预估", "186.42", "USDT"],
  ["资源使用率", "72%", "正常"],
];

export default function Home() {
  const [view, setView] = useState<"market" | "console">("market");
  const [locale, setLocale] = useState<"zh" | "en">("zh");
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
      <nav className="nav shell">
        <button className="brand" onClick={() => setView("market")} aria-label="返回首页">
          <img src="/hexbit-logo-primary.svg" alt="HEXBIT" width="144" height="40" />
        </button>
        <div className="nav-links">
          <button onClick={() => setView("market")} className={view === "market" ? "active" : ""}>{copy.market}</button>
          <button onClick={openConsole} className={view === "console" ? "active" : ""}>{copy.console}</button>
          <button onClick={() => setNotice(en ? "Documentation is coming soon" : "文档中心即将开放")}>{copy.docs}</button>
        </div>
        <div className="nav-actions"><select className="language-switcher" value={locale} onChange={(event) => setLocale(event.target.value as "zh" | "en")} aria-label="Language"><option value="zh">中文</option><option value="en">EN</option></select>{authenticated && <span className="balance">{copy.balance} · {balance.toFixed(2)} USDT</span>}{authenticated ? <button className="avatar" onClick={() => setNotice(copy.loggedIn)}>CH</button> : <button className="login-link" onClick={() => setLoginOpen(true)}>{en ? "Sign in" : "登录"}</button>}</div>
      </nav>

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
      ) : <Console onNotice={setNotice} onRent={() => setView("market")} onCharge={() => setChargeOpen(true)} balance={balance} />}

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

function Console({ onNotice, onRent, onCharge, balance }: { onNotice: (value: string) => void; onRent: () => void; onCharge: () => void; balance: number }) {
  const [tab, setTab] = useState("实例");
  const [instanceStatus, setInstanceStatus] = useState("运行中");
  return <section className="console shell"><div className="console-header"><div><span className="eyebrow"><i /> YOUR WORKSPACE</span><h1>控制台</h1><p>管理你的实例、账单与钱包。</p></div><div className="console-actions"><button className="secondary" onClick={onCharge}>充值 {balance.toFixed(2)} USDT</button><button className="primary" onClick={onRent}>+ 创建实例</button></div></div><div className="stats">{statusItems.map(([label, value, extra]) => <div key={label}><small>{label}</small><b>{label === "可用余额" ? balance.toFixed(2) : value}</b><span>{extra}</span></div>)}</div><div className="tabs">{["实例", "消费账单", "充值记录", "API 密钥"].map((item) => <button key={item} onClick={() => setTab(item)} className={tab === item ? "active" : ""}>{item}</button>)}</div>{tab === "实例" ? <div className="instances"><div className="instances-head"><span>实例</span><span>区域</span><span>公网 IP</span><span>计费</span><span>状态</span><span /></div><div className="instance-row"><div><b>sg-c16-048</b><small>Compute C16 · 16 vCPU / 64 GB</small></div><span>Singapore</span><code>103.28.74.16</code><span>$0.084/h</span><span className={`pill ${instanceStatus === "运行中" ? "running" : "off"}`}><i /> {instanceStatus}</span><div className="row-actions"><button onClick={() => onNotice("SSH 指令已复制：ssh root@103.28.74.16")}>SSH</button><button onClick={() => setInstanceStatus(instanceStatus === "运行中" ? "已停止" : "运行中")}>{instanceStatus === "运行中" ? "停止" : "启动"}</button><button className="danger" onClick={() => { setInstanceStatus("已销毁"); onNotice("实例已销毁，计费已停止") }}>销毁</button></div></div></div> : <UsagePanel tab={tab} />}</section>;
}

function UsagePanel({ tab }: { tab: string }) { return <div className="usage-panel"><div className="usage-total"><span>{tab === "消费账单" ? "本月消费" : tab === "充值记录" ? "累计充值" : "API Token 余额"}</span><b>{tab === "消费账单" ? "186.42 USDT" : tab === "充值记录" ? "2,500.00 USDT" : "sk-hexbit-••••••••"}</b></div><div className="usage-row"><span>2026-08-06</span><span>{tab === "消费账单" ? "GPU 实例 · Compute C16" : tab === "充值记录" ? "TRC20 充值确认" : "默认生产 Key"}</span><b>{tab === "消费账单" ? "− 2.02 USDT" : tab === "充值记录" ? "+ 500.00 USDT" : "活跃"}</b></div><div className="usage-row"><span>2026-08-05</span><span>{tab === "消费账单" ? "Qwen API · 2.4M tokens" : tab === "充值记录" ? "TRC20 充值确认" : "测试环境 Key"}</span><b>{tab === "消费账单" ? "− 0.71 USDT" : tab === "充值记录" ? "+ 1,000.00 USDT" : "已限制"}</b></div></div>}
