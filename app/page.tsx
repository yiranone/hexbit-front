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
  const navItems = [["⌂", "首页"], ["◇", "模型 API"], ["▣", "GPU 服务器"], ["◫", "实例管理"], ["◌", "用量与账单"], ["⌘", "API 密钥"]];
  const models = [["Q", "Qwen3-235B", "Qwen", "$0.18/M 输入 · $0.72/M 输出"], ["D", "DeepSeek-V3", "DeepSeek", "$0.14/M 输入 · $0.56/M 输出"], ["G", "GLM-4.7", "Zhipu AI", "$0.22/M 输入 · $0.88/M 输出"]];
  return <section className="dashboard"><aside className="dashboard-side"><img src="/hexbit-logo-primary.svg" alt="HEXBIT" /><div className="side-nav">{navItems.map(([icon, item]) => <button key={item} className={section === item ? "active" : ""} onClick={() => setSection(item)}><i>{icon}</i>{item}<span>›</span></button>)}</div><div className="side-bottom"><button onClick={onCharge}>◉ 财务与充值 <span>›</span></button><button onClick={() => onNotice("已打开帮助中心")}>? 帮助中心</button></div></aside><div className="dashboard-work"><header className="dashboard-top"><div className="workspace-name">工作区 <b>默认项目⌄</b></div><div><button className="agent-pill">✦ AI 助手</button><button className="top-icon" onClick={() => onNotice("暂无新通知")}>♢</button><button className="wallet-pill" onClick={onCharge}>◉ {balance.toFixed(2)} USDT</button><button className="profile">CH</button></div></header><main className="dashboard-content"><h1>{section}</h1>{section === "首页" ? <><h2>快速开始</h2><div className="product-grid"><article><div className="product-icon purple">◇</div><h3>模型 Token API</h3><p>通过 OpenAI 兼容接口使用 Qwen、DeepSeek、GLM 等模型，并支持面向客户的二次分发。</p><button onClick={() => setSection("模型 API")}>获取 API Key →</button></article><article><div className="product-icon blue">▣</div><h3>GPU 服务器</h3><p>创建专属 GPU 实例，部署和运营你的模型、推理服务与 AI 应用。</p><button onClick={onRent}>+ 创建服务器</button></article><article><div className="product-icon coral">◫</div><h3>实例管理</h3><p>统一查看服务器状态、SSH 登录信息、运行时长与资源消费。</p><button onClick={() => setSection("实例管理")}>查看实例 →</button></article></div><div className="launch-panel"><div className="launch-head"><div><h2>模型 API</h2><p>选择模型，获取 API Key 后即可开始调用。</p></div><button onClick={() => setSection("模型 API")}>模型广场 →</button></div><div className="model-grid">{models.map(([mark, name, company, price]) => <article key={name}><b>{mark}</b><h3>{name}</h3><p>{company}</p><small>{price}</small><span>文本生成</span></article>)}</div></div></> : <RichSection section={section} onRent={onRent} onCharge={onCharge} balance={balance} />}</main></div></section>;
}

function RichSection({ section, onRent, onCharge, balance }: { section: string; onRent: () => void; onCharge: () => void; balance: number }) {
  const api = section === "模型 API", gpu = section === "GPU 服务器", instances = section === "实例管理", billing = section === "用量与账单";
  const title = api ? "模型 API 与 Token 服务" : gpu ? "GPU 服务器目录" : instances ? "实例管理" : billing ? "用量与账单" : "API 密钥";
  const action = api ? "创建 API Key" : gpu ? "+ 创建服务器" : instances ? "+ 新建实例" : billing ? "充值 USDT" : "+ 创建密钥";
  return <div className="rich-section"><div className="rich-hero"><div><span>HEXBITCPU · {api ? "MODEL STUDIO" : gpu ? "COMPUTE" : billing ? "FINANCE" : "DEVELOPER"}</span><h2>{title}</h2><p>{api ? "统一接入中国开源大模型，按 Token 用量付费并支持二次分发。" : gpu ? "选择适合训练和推理的 GPU，按小时计费，按需释放。" : instances ? "查看实时状态、连接方式与每台实例的资源消费。" : billing ? "透明查看 GPU 时长、Token 调用与余额变动。" : "为生产、测试和合作伙伴分别配置安全的访问凭证。"}</p></div><button className="primary" onClick={gpu || instances ? onRent : onCharge}>{action}</button></div><div className="metric-row"><article><span>{api ? "本月 Token" : gpu ? "可用 GPU" : instances ? "运行中" : billing ? "可用余额" : "活跃密钥"}</span><b>{api ? "24.8M" : gpu ? "38" : instances ? "3" : billing ? `${balance.toFixed(2)} USDT` : "2"}</b><small>较昨日 +12%</small></article><article><span>{api ? "平均延迟" : gpu ? "起步价格" : instances ? "资源使用率" : billing ? "本月消费" : "请求总数"}</span><b>{api ? "418 ms" : gpu ? "$0.42/h" : instances ? "72%" : billing ? "186.42 USDT" : "182,406"}</b><small>实时更新</small></article><article><span>{api ? "可用模型" : gpu ? "GPU 型号" : instances ? "告警" : billing ? "充值总额" : "权限角色"}</span><b>{api ? "12" : gpu ? "8" : instances ? "0" : billing ? "2,500 USDT" : "3"}</b><small>当前工作区</small></article></div><div className="data-card"><div className="data-card-head"><h3>{api ? "可调用模型" : gpu ? "推荐 GPU" : instances ? "服务器列表" : billing ? "最近消费明细" : "密钥列表"}</h3><button onClick={() => onCharge()}>{billing ? "充值记录 →" : "查看全部 →"}</button></div><div className="data-list">{(api ? [["Qwen3-235B", "文本生成 · 128K 上下文", "$0.18 / M 输入"], ["DeepSeek-V3", "推理增强 · OpenAI 兼容", "$0.14 / M 输入"], ["GLM-4.7", "工具调用 · 企业级", "$0.22 / M 输入"]] : gpu ? [["RTX 4090", "24 GB · Singapore", "$0.42 / 小时"], ["A100 80GB", "80 GB · Hong Kong", "$0.96 / 小时"], ["H100 SXM", "80 GB · Tokyo", "$1.84 / 小时"]] : instances ? [["sg-gpu-4090-01", "运行中 · Singapore · 103.28.74.16", "$0.42 / 小时"], ["hk-a100-inference", "已停止 · Hong Kong", "$0.96 / 小时"], ["tk-h100-finetune", "运行中 · Tokyo", "$1.84 / 小时"]] : billing ? [["GPU 实例 Compute C16", "2026-08-06 · 24 小时", "− 2.02 USDT"], ["Qwen3 API", "2026-08-06 · 2.4M tokens", "− 0.71 USDT"], ["TRC20 充值", "2026-08-05 · 已确认", "+ 500.00 USDT"]] : [["生产环境 Key", "sk-hexbit-••••••12 · 完整权限", "活跃"], ["合作伙伴 Key", "sk-hexbit-••••••89 · 仅模型 API", "活跃"], ["测试环境 Key", "sk-hexbit-••••••44 · 每日限额", "已限制"]]).map(([name, note, value]) => <div key={name}><span className="row-dot" /><strong>{name}<small>{note}</small></strong><b>{value}</b><button>管理</button></div>)}</div></div></div>;
}

function DashboardSection({ section, onRent, onCharge, balance }: { section: string; onRent: () => void; onCharge: () => void; balance: number }) { const server = section === "GPU 服务器" || section === "实例管理"; return <div className="dashboard-detail"><div className="detail-banner"><div><span>HEXBITCPU CONSOLE</span><h2>{server ? "创建并管理你的 GPU 推理服务" : section === "模型 API" ? "把主流开源模型接入你的产品" : section === "用量与账单" ? "清晰掌握每一笔 AI 消费" : "安全地管理开发者访问凭证"}</h2><p>{server ? "专属实例、透明价格与按小时计费。" : "这是前端演示数据，接入后端后会显示真实账户信息。"}</p></div><button className="primary" onClick={server ? onRent : onCharge}>{server ? "+ 创建服务器" : `余额 ${balance.toFixed(2)} USDT`}</button></div><div className="detail-table"><b>{server ? "服务器概览" : "最近活动"}</b><div><span>2026-08-06</span><span>{server ? "sg-gpu-4090-01 · 运行中" : "Qwen3 API · 2.4M tokens"}</span><strong>{server ? "$0.42 / 小时" : "− 0.71 USDT"}</strong></div><div><span>2026-08-05</span><span>{server ? "hk-gpu-a100-02 · 已停止" : "TRC20 充值确认"}</span><strong>{server ? "$0.96 / 小时" : "+ 500.00 USDT"}</strong></div></div></div> }

function Console({ onNotice, onRent, onCharge, balance }: { onNotice: (value: string) => void; onRent: () => void; onCharge: () => void; balance: number }) {
  const [tab, setTab] = useState("实例");
  const [instanceStatus, setInstanceStatus] = useState("运行中");
  return <section className="console shell"><div className="console-header"><div><span className="eyebrow"><i /> YOUR WORKSPACE</span><h1>控制台</h1><p>管理你的实例、账单与钱包。</p></div><div className="console-actions"><button className="secondary" onClick={onCharge}>充值 {balance.toFixed(2)} USDT</button><button className="primary" onClick={onRent}>+ 创建实例</button></div></div><div className="stats">{statusItems.map(([label, value, extra]) => <div key={label}><small>{label}</small><b>{label === "可用余额" ? balance.toFixed(2) : value}</b><span>{extra}</span></div>)}</div><div className="tabs">{["实例", "消费账单", "充值记录", "API 密钥"].map((item) => <button key={item} onClick={() => setTab(item)} className={tab === item ? "active" : ""}>{item}</button>)}</div>{tab === "实例" ? <div className="instances"><div className="instances-head"><span>实例</span><span>区域</span><span>公网 IP</span><span>计费</span><span>状态</span><span /></div><div className="instance-row"><div><b>sg-c16-048</b><small>Compute C16 · 16 vCPU / 64 GB</small></div><span>Singapore</span><code>103.28.74.16</code><span>$0.084/h</span><span className={`pill ${instanceStatus === "运行中" ? "running" : "off"}`}><i /> {instanceStatus}</span><div className="row-actions"><button onClick={() => onNotice("SSH 指令已复制：ssh root@103.28.74.16")}>SSH</button><button onClick={() => setInstanceStatus(instanceStatus === "运行中" ? "已停止" : "运行中")}>{instanceStatus === "运行中" ? "停止" : "启动"}</button><button className="danger" onClick={() => { setInstanceStatus("已销毁"); onNotice("实例已销毁，计费已停止") }}>销毁</button></div></div></div> : <UsagePanel tab={tab} />}</section>;
}

function UsagePanel({ tab }: { tab: string }) { return <div className="usage-panel"><div className="usage-total"><span>{tab === "消费账单" ? "本月消费" : tab === "充值记录" ? "累计充值" : "API Token 余额"}</span><b>{tab === "消费账单" ? "186.42 USDT" : tab === "充值记录" ? "2,500.00 USDT" : "sk-hexbit-••••••••"}</b></div><div className="usage-row"><span>2026-08-06</span><span>{tab === "消费账单" ? "GPU 实例 · Compute C16" : tab === "充值记录" ? "TRC20 充值确认" : "默认生产 Key"}</span><b>{tab === "消费账单" ? "− 2.02 USDT" : tab === "充值记录" ? "+ 500.00 USDT" : "活跃"}</b></div><div className="usage-row"><span>2026-08-05</span><span>{tab === "消费账单" ? "Qwen API · 2.4M tokens" : tab === "充值记录" ? "TRC20 充值确认" : "测试环境 Key"}</span><b>{tab === "消费账单" ? "− 0.71 USDT" : tab === "充值记录" ? "+ 1,000.00 USDT" : "已限制"}</b></div></div>}
