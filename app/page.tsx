"use client";

import { useEffect, useMemo, useState } from "react";
import { ConsoleSections, initialInstances, type Instance } from "./console-sections";
import type { ServerCreateRequest } from "./create-server";
import { api, ApiError, clearAccessToken, hasAccessToken, type ApiInstance, type ApiOffering, type ApiOrder } from "../src/api";
import {
  Activity,
  Bell,
  BookOpen,
  Box,
  Check,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
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
  Send,
  Sparkles,
  WalletCards,
  X,
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

const fallbackMachines: Machine[] = [
  { id: "c-16", name: "Compute C16", region: "Singapore", cpu: "AMD EPYC 9354P", cores: 16, memory: "64 GB", disk: "480 GB NVMe", network: "1 Gbps", price: 0.084, stock: 12, badge: "推荐" },
  { id: "c-32", name: "Compute C32", region: "Hong Kong", cpu: "AMD EPYC 9354P", cores: 32, memory: "128 GB", disk: "960 GB NVMe", network: "2 Gbps", price: 0.158, stock: 7 },
  { id: "p-24", name: "Performance P24", region: "Tokyo", cpu: "Intel Xeon 8470", cores: 24, memory: "96 GB", disk: "1 TB NVMe", network: "2 Gbps", price: 0.139, stock: 3, badge: "高频" },
  { id: "m-8", name: "Memory M8", region: "Singapore", cpu: "AMD EPYC 9334", cores: 8, memory: "128 GB", disk: "480 GB NVMe", network: "1 Gbps", price: 0.094, stock: 9 },
  { id: "c-64", name: "Compute C64", region: "Frankfurt", cpu: "AMD EPYC 9654", cores: 64, memory: "256 GB", disk: "1.9 TB NVMe", network: "5 Gbps", price: 0.312, stock: 2, badge: "限量" },
  { id: "e-4", name: "Edge E4", region: "Los Angeles", cpu: "AMD EPYC 9174F", cores: 4, memory: "16 GB", disk: "160 GB NVMe", network: "500 Mbps", price: 0.028, stock: 18 },
];

function offeringToMachine(offering: ApiOffering): Machine {
  return {
    id: offering.id,
    name: offering.name,
    region: offering.region,
    cpu: offering.cpu_model,
    cores: offering.vcpu,
    memory: `${offering.memory_gib} GB`,
    disk: `${offering.disk_gib} GB NVMe`,
    network: offering.network_mbps >= 1000 ? `${offering.network_mbps / 1000} Gbps` : `${offering.network_mbps} Mbps`,
    price: offering.price_hourly ?? 0,
    stock: offering.stock,
  };
}

function apiInstanceToConsole(instance: ApiInstance): Instance {
  return {
    id: instance.id,
    name: instance.name,
    status: instance.status === "running" ? "运行中" : "已停止",
    region: instance.region,
    zone: instance.zone,
    spec: instance.spec,
    disk: `NVMe ${instance.disk_gib} GiB`,
    os: instance.image,
    publicIp: instance.public_ip ?? "未绑定",
    privateIp: instance.private_ip ?? "自动分配",
    billing: instance.billing_mode === "monthly" ? `包月 · ${instance.duration_months ?? 1} 个月` : "按量计费",
    price: `${instance.currency} ${instance.price.toFixed(3)}/${instance.billing_mode === "monthly" ? "mo" : "h"}`,
    duration: instance.duration_months,
    autoRenew: instance.auto_renew,
    vpc: instance.vpc,
  };
}

export default function Home() {
  const [view, setView] = useState<"market" | "console">("market");
  const [locale, setLocale] = useState<"zh" | "en">("zh");
  const [languageOpen, setLanguageOpen] = useState(false);
  const [region, setRegion] = useState("all");
  const [machines, setMachines] = useState<Machine[]>(fallbackMachines);
  const [selected, setSelected] = useState<Machine | null>(null);
  const [hours, setHours] = useState(24);
  const [paid, setPaid] = useState(false);
  const paymentMethod = "账户余额";
  const [notice, setNotice] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [accountName, setAccountName] = useState("HEXBIT 用户");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("admin");
  const [authPassword, setAuthPassword] = useState("admin");
  const [authDisplayName, setAuthDisplayName] = useState("Chen");
  const [authPending, setAuthPending] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [chargeOpen, setChargeOpen] = useState(false);
  const [balance, setBalance] = useState(0);
  const [consoleInstances, setConsoleInstances] = useState<Instance[]>(initialInstances);
  const [consoleStartSection, setConsoleStartSection] = useState("首页");
  const [purchasePending, setPurchasePending] = useState(false);

  useEffect(() => {
    api.offerings("cpu")
      .then((items) => setMachines(items.map(offeringToMachine)))
      .catch(() => undefined);

    if (!hasAccessToken()) return;
    Promise.all([api.profile(), api.wallet(), api.instances()])
      .then(([user, wallet, instances]) => {
        setAuthenticated(true);
        setAccountName(user.display_name);
        setBalance(wallet.balance);
        setConsoleInstances((instances ?? []).map(apiInstanceToConsole));
      })
      .catch(() => {
        clearAccessToken();
        setAuthenticated(false);
      });
  }, []);

  const inventory = useMemo(
    () => machines.filter((m) => region === "all" || m.region === region),
    [machines, region],
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
  const signIn = async () => {
    setAuthPending(true);
    try {
      if (authMode === "register") {
        const user = await api.register(authEmail, authPassword, authDisplayName);
        setAccountName(user.display_name);
      } else {
        const user = await api.login(authEmail, authPassword);
        setAccountName(user.display_name);
      }
      const [wallet, instances] = await Promise.all([api.wallet(), api.instances()]);
      setAuthenticated(true);
      setBalance(wallet.balance);
      setConsoleInstances((instances ?? []).map(apiInstanceToConsole));
      setLoginOpen(false);
      setNotice(en ? "Welcome to your console" : authMode === "register" ? "账户创建成功" : "登录成功，欢迎进入控制台");
      setView("console");
    } catch (error) {
      const message = error instanceof ApiError && error.status === 401 ? "账号或密码错误" : error instanceof Error ? error.message : "登录失败";
      setNotice(message);
    } finally {
      setAuthPending(false);
    }
  };
  const purchaseSelectedMachine = async () => {
    if (!selected) return;
    setPurchasePending(true);
    try {
      const created = await api.createInstances({
        offering_id: selected.id,
        name: `${selected.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now().toString().slice(-4)}`,
        billing_mode: "hourly",
        duration: hours,
        quantity: 1,
        image: "Ubuntu 24.04 LTS",
      });
      const wallet = await api.wallet();
      setBalance(wallet.balance);
      setConsoleInstances((items) => [...created.map(apiInstanceToConsole), ...items]);
      setPaid(true);
    } catch (error) {
      setNotice(error instanceof ApiError && error.code === "insufficient_funds" ? "账户余额不足，请先充值" : error instanceof Error ? error.message : "实例创建失败");
    } finally {
      setPurchasePending(false);
    }
  };
  const topUp = async (amount: number) => {
    try {
      const wallet = await api.topUp(amount);
      setBalance(wallet.balance);
      setChargeOpen(false);
      setNotice(en ? `${amount} USDT added to your wallet` : `已充值 ${amount} USDT`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "充值失败");
    }
  };
  const refreshInstances = async () => {
    const instances = await api.instances();
    setConsoleInstances((instances ?? []).map(apiInstanceToConsole));
  };
  const handleInstanceAction = async (id: string, action: "start" | "stop") => {
    await api.instanceAction(id, action);
    await refreshInstances();
  };
  const handleInstanceUpdate = async (id: string, input: { name?: string; auto_renew?: boolean }) => {
    await api.updateInstance(id, input);
    await refreshInstances();
  };
  const handleInstanceDelete = async (id: string) => {
    await api.deleteInstance(id);
    await refreshInstances();
  };
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
          <button onClick={openConsole}>{copy.console}</button>
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
      ) : <DashboardConsole accountName={accountName} onNotice={setNotice} onCharge={() => setChargeOpen(true)} balance={balance} setBalance={setBalance} instances={consoleInstances} setInstances={setConsoleInstances} initialSection={consoleStartSection} onInstanceAction={handleInstanceAction} onInstanceUpdate={handleInstanceUpdate} onInstanceDelete={handleInstanceDelete} />}

      {selected && <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelected(null)}><section className="checkout" role="dialog" aria-modal="true" aria-label="创建实例" onMouseDown={(e) => e.stopPropagation()}>
        <button className="close" onClick={() => setSelected(null)}>×</button>
        {!paid ? <><span className="eyebrow"><i /> NEW INSTANCE</span><h2>确认租用配置</h2><div className="order-machine"><b>{selected.name}</b><span>⌖ {selected.region} · {selected.cores} vCPU · {selected.memory}</span></div><label className="field">租用时长 <div className="stepper"><button onClick={() => setHours(Math.max(1, hours - 1))}>−</button><b>{hours} 小时</b><button onClick={() => setHours(hours + 1)}>+</button></div></label><div className="payment"><div><span>支付方式</span><b>$ {paymentMethod}</b></div></div><div className="total"><span>订单总计</span><strong>{total} <small>USDT</small></strong></div><button className="primary wide" disabled={purchasePending} onClick={purchaseSelectedMachine}>{purchasePending ? "正在创建实例..." : `确认并支付 ${total} USDT`}</button><p className="muted">费用将从账户余额扣除，创建请求支持幂等保护。</p></> : <div className="success"><div className="check">✓</div><span className="eyebrow"><i /> PAYMENT CONFIRMED</span><h2>实例创建成功</h2><p>实例已经写入控制台，当前处于停止状态，可在实例管理中启动。</p><button className="primary wide" onClick={() => { setConsoleStartSection("实例管理"); setSelected(null); setView("console"); }}>查看实例控制台 →</button></div>}
      </section></div>}
      {notice && <div className="toast">{notice}<button onClick={() => setNotice("")}>×</button></div>}
      {loginOpen && <div className="modal-backdrop"><section className="auth-card" role="dialog" aria-modal="true" aria-label={authMode === "login" ? "登录" : "注册"}><button className="close" onClick={() => setLoginOpen(false)}>×</button><span className="eyebrow"><i /> HEXBITCPU CONSOLE</span><h2>{authMode === "login" ? (en ? "Sign in to your console" : "登录控制台") : (en ? "Create your account" : "创建账户")}</h2><p>{en ? "Manage servers, balance and model API usage in one workspace." : "在一个工作台中管理服务器、余额和模型 API 用量。"}</p>{authMode === "login" && <div className="demo-credentials">{en ? "Test account: admin / admin" : "测试账号：admin / admin"}</div>}{authMode === "register" && <label>{en ? "Display name" : "显示名称"}<input value={authDisplayName} onChange={(event) => setAuthDisplayName(event.target.value)} placeholder="Chen" /></label>}<label>{authMode === "login" ? (en ? "Account" : "账号") : (en ? "Email" : "邮箱")}<input type={authMode === "login" ? "text" : "email"} placeholder={authMode === "login" ? "admin" : "name@company.com"} value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} /></label><label>{en ? "Password" : "密码"}<input type="password" placeholder={authMode === "login" ? "admin" : (en ? "At least 8 characters" : "至少 8 个字符")} value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} /></label><button className="primary wide" disabled={authPending} onClick={signIn}>{authPending ? (en ? "Please wait..." : "请稍候...") : authMode === "login" ? (en ? "Sign in" : "登录") : (en ? "Create account" : "注册")} →</button><small><button className="text-button" onClick={() => setAuthMode((mode) => mode === "login" ? "register" : "login")}>{authMode === "login" ? (en ? "Create an account" : "没有账户？立即注册") : (en ? "Back to sign in" : "已有账户？返回登录")}</button></small></section></div>}
      {chargeOpen && <div className="modal-backdrop"><section className="auth-card charge-card" role="dialog" aria-modal="true" aria-label="充值"><button className="close" onClick={() => setChargeOpen(false)}>×</button><span className="eyebrow"><i /> WALLET TOP-UP</span><h2>{en ? "Add USDT balance" : "充值 USDT"}</h2><p>{en ? "Choose an amount. Development top-up is recorded in the wallet ledger." : "选择充值金额，开发环境充值会写入钱包流水。"}</p><div className="amount-grid">{[100, 500, 1000].map((amount) => <button key={amount} onClick={() => topUp(amount)}>{amount} USDT</button>)}</div><div className="wallet-address">DEVELOPMENT<br /><b>MySQL wallet ledger</b></div></section></div>}
    </main>
  );
}

function DashboardConsole({ accountName, onNotice, onCharge, balance, setBalance, instances, setInstances, initialSection, onInstanceAction, onInstanceUpdate, onInstanceDelete }: { accountName: string; onNotice: (value: string) => void; onCharge: () => void; balance: number; setBalance: React.Dispatch<React.SetStateAction<number>>; instances: Instance[]; setInstances: React.Dispatch<React.SetStateAction<Instance[]>>; initialSection: string; onInstanceAction: (id: string, action: "start" | "stop") => Promise<void>; onInstanceUpdate: (id: string, input: { name?: string; auto_renew?: boolean }) => Promise<void>; onInstanceDelete: (id: string) => Promise<void> }) {
  const [section, setSection] = useState(initialSection);
  const [createServerRequest, setCreateServerRequest] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [consoleRegion, setConsoleRegion] = useState("中国重庆二区");
  const [regionOpen, setRegionOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantText, setAssistantText] = useState("");
  const [assistantMessages, setAssistantMessages] = useState<string[]>(["您好，我可以帮助查询资源、费用和告警状态。"]);
  const [profileOpen, setProfileOpen] = useState(false);
  const navItems = [
    { label: "首页", icon: LayoutDashboard },
    { label: "模型 API", icon: Sparkles },
    { label: "GPU 服务器", icon: Cpu },
    { label: "实例管理", icon: Server },
    { label: "资源中心", icon: Database },
    { label: "云监控", icon: Activity },
    { label: "用量与账单", icon: ReceiptText },
    { label: "订单管理", icon: ClipboardList },
    { label: "API 密钥", icon: KeyRound },
  ];
  const sendAssistantMessage = () => {
    const message = assistantText.trim();
    if (!message) return;
    setAssistantMessages((items) => [...items, `您：${message}`, "AI 助手：已根据当前控制台数据生成处理建议，相关资源状态正常。"]);
    setAssistantText("");
  };
  const openServerCreate = () => {
    setCreateServerRequest(true);
    setSection("GPU 服务器");
  };
  const createOrder = async (request: ServerCreateRequest) => {
    try {
      const order = await api.createOrder({
        offering_id: request.spec.id,
        name: request.serverName,
        billing_mode: "monthly",
        duration: request.duration,
        quantity: request.quantity,
        image: request.image,
        vpc: request.vpc,
        private_ip: request.privateIp,
        auto_renew: request.autoRenew,
        resource_group: request.resourceGroup,
      });
      onNotice(`订单 ${order.id} 已生成，请确认支付`);
      return order;
    } catch (error) {
      const message = error instanceof Error ? error.message : "订单创建失败";
      onNotice(message);
      throw new Error(message);
    }
  };
  const payOrder = async (order: ApiOrder) => {
    try {
      const result = await api.payOrder(order.id);
      const wallet = await api.wallet();
      setBalance(wallet.balance);
      setInstances((items) => [...result.instances.map(apiInstanceToConsole), ...items]);
      setCreateServerRequest(false);
      setSection("实例管理");
      onNotice(`订单 ${order.id} 支付成功，已创建 ${result.instances.length} 台服务器`);
    } catch (error) {
      const message = error instanceof ApiError && error.code === "insufficient_funds" ? "账户余额不足，请先充值" : error instanceof Error ? error.message : "购买失败";
      onNotice(message);
      throw new Error(message);
    }
  };

  return <section className={`dashboard ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
    <aside className="dashboard-side">
      <img className="side-logo-full" src="/hexbit-logo-primary.svg" alt="HEXBIT" />
      <img className="side-logo-mark" src="/hexbit-mark.svg" alt="" />
      <div className="side-nav">{navItems.map(({ label, icon: Icon }) => <button key={label} title={sidebarCollapsed ? label : undefined} aria-label={label} className={section === label ? "active" : ""} onClick={() => setSection(label)}><Icon size={17} />{label}<ChevronRight size={15} /></button>)}</div>
      <div className="side-bottom"><button title={sidebarCollapsed ? "财务与充值" : undefined} aria-label="财务与充值" onClick={onCharge}><WalletCards size={17} />财务与充值<ChevronRight size={15} /></button><button title={sidebarCollapsed ? "帮助中心" : undefined} aria-label="帮助中心" onClick={() => setSection("帮助中心")}><HelpCircle size={17} />帮助中心</button></div>
    </aside>
    <div className="dashboard-work">
      <header className="dashboard-top">
        <div className="console-context"><button className="top-icon" aria-label={sidebarCollapsed ? "展开左侧菜单" : "收起左侧菜单"} aria-expanded={!sidebarCollapsed} onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}><Menu size={19} /></button><span>区域</span><div className="top-popover-wrap"><button className="region-select" aria-expanded={regionOpen} onClick={() => setRegionOpen((open) => !open)}><Globe2 size={15} />{consoleRegion}<ChevronRight size={13} /></button>{regionOpen && <div className="top-popover region-popover" role="menu">{["中国重庆二区", "新加坡一区", "中国香港一区", "日本东京一区"].map((item) => <button key={item} className={consoleRegion === item ? "selected" : ""} onClick={() => { setConsoleRegion(item); setRegionOpen(false); onNotice(`区域已切换为${item}`); }}>{item}{consoleRegion === item && <Check size={14} />}</button>)}</div>}</div></div>
        <nav className="top-links"><button onClick={() => setSection("用量与账单")}>费用</button><button onClick={() => setSection("资源中心")}>资源</button><button onClick={() => setSection("用户与权限")}>用户</button><button onClick={() => setSection("帮助中心")}>文档</button></nav>
        <div className="top-actions"><button className="agent-pill" onClick={() => setAssistantOpen(true)}><Sparkles size={14} />AI 助手</button><button className="top-icon" aria-label="通知" onClick={() => setSection("消息中心")}><Bell size={18} /></button><button className="wallet-pill" onClick={onCharge}><CircleDollarSign size={15} />{balance.toFixed(2)} USDT</button><div className="top-popover-wrap"><button className="profile" title={accountName} aria-expanded={profileOpen} onClick={() => setProfileOpen((open) => !open)}>{accountName.slice(0, 2).toUpperCase()}</button>{profileOpen && <div className="top-popover profile-popover" role="menu"><div><b>{accountName}</b><span>根用户</span></div><button onClick={() => { setSection("API 密钥"); setProfileOpen(false); }}>访问密钥</button><button onClick={() => { setSection("用量与账单"); setProfileOpen(false); }}>计费账户</button><button onClick={() => { setSection("账号中心"); setProfileOpen(false); }}>账号资料</button></div>}</div></div>
      </header>
      <main className="dashboard-content">{section === "首页" ? <ConsoleHome accountName={accountName} instances={instances} balance={balance} onCharge={onCharge} onNotice={onNotice} onRent={openServerCreate} setSection={setSection} /> : <ConsoleSections section={section} accountName={accountName} onRent={openServerCreate} onCharge={onCharge} onNotice={onNotice} balance={balance} createServerRequest={createServerRequest} onCreateServerHandled={() => setCreateServerRequest(false)} instances={instances} setInstances={setInstances} onOrderCreated={createOrder} onOrderPaid={payOrder} onInstanceAction={onInstanceAction} onInstanceUpdate={onInstanceUpdate} onInstanceDelete={onInstanceDelete} />}</main>
    </div>
    {assistantOpen && <div className="assistant-backdrop" onMouseDown={() => setAssistantOpen(false)}><aside className="assistant-drawer" role="dialog" aria-modal="true" aria-label="AI 助手" onMouseDown={(event) => event.stopPropagation()}><header><div><Sparkles size={17} /><span><b>AI 助手</b><small>控制台资源助手</small></span></div><button className="icon-button" aria-label="关闭 AI 助手" onClick={() => setAssistantOpen(false)}><X size={16} /></button></header><div className="assistant-quick">{["检查资源状态", "分析本月费用", "查看未处理告警"].map((item) => <button key={item} onClick={() => setAssistantMessages((messages) => [...messages, `您：${item}`, `AI 助手：${item}已完成，当前未发现异常。`])}>{item}</button>)}</div><div className="assistant-messages">{assistantMessages.map((message, index) => <p key={`${message}${index}`} className={message.startsWith("您：") ? "user" : "assistant"}>{message}</p>)}</div><div className="assistant-input"><input value={assistantText} onChange={(event) => setAssistantText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") sendAssistantMessage(); }} placeholder="询问资源、费用或告警" /><button aria-label="发送消息" disabled={!assistantText.trim()} onClick={sendAssistantMessage}><Send size={16} /></button></div></aside></div>}
  </section>;
}

function ConsoleHome({ accountName, instances, balance, onCharge, onNotice, onRent, setSection }: { accountName: string; instances: Instance[]; balance: number; onCharge: () => void; onNotice: (value: string) => void; onRent: () => void; setSection: (value: string) => void }) {
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
    <div className="home-title"><div><p>CONSOLE OVERVIEW</p><h1>下午好，{accountName}</h1><span>资源、费用与告警状态已更新</span></div><button className="primary" onClick={onRent}><Plus size={16} />创建资源</button></div>
    <div className="home-layout">
      <div className="home-main">
        <section className="panel quick-panel"><div className="panel-title"><div><h2>最近访问</h2><p>常用云服务与管理入口</p></div><button className="text-button" onClick={() => onNotice("自定义入口已打开")}>自定义</button></div><div className="quick-links">{quickLinks.map(([label, Icon]) => <button key={label} onClick={() => label.includes("费用") ? setSection("用量与账单") : label.includes("资源管理") || label.includes("数据管理") ? setSection("资源中心") : label.includes("算力") || label.includes("计算") ? setSection("GPU 服务器") : onNotice(`已打开${label}`)}><Icon size={17} /><span>{label}</span><ChevronRight size={14} /></button>)}</div></section>
        <section className="service-banner"><div><span>MODELSTUDIO</span><h2>模型开发与推理服务已升级</h2><p>统一管理模型 API、GPU 算力和实例资源。</p></div><button onClick={() => setSection("模型 API")}>立即体验<ChevronRight size={15} /></button></section>
        <section className="panel service-overview"><div className="panel-title"><div><h2>我的服务</h2><p>云资源运行概览</p></div><button className="text-button" onClick={() => setSection("云监控")}>查看全部</button></div><div className="service-body"><div className="service-map"><div className="map-grid">{Array.from({ length: 12 }).map((_, index) => <i key={index} className={index === 6 ? "active" : index === 9 ? "warning" : ""}><Box size={16} /></i>)}</div><div className="map-legend"><span><i />已拥有</span><span><i />未拥有</span><span><i />待续费</span></div></div><div className="service-detail"><div className="service-detail-head"><div className="service-logo"><Gauge size={22} /></div><div><h3>云监控服务 CMS</h3><span className="status-label success"><i />运行正常</span></div></div><p>从基础设施、系统服务与运行任务等维度监控云资源，集中查看状态与告警。</p><div className="service-actions"><button className="secondary" onClick={() => setSection("云监控")}>查看详情</button><button className="primary" onClick={() => setSection("云监控")}>前往控制台</button></div><div className="related-services"><span>关联产品</span><button onClick={() => setSection("资源中心")}>文件存储 AFS</button><button onClick={() => setSection("资源中心")}>对象存储 AOSS</button><button onClick={() => setSection("实例管理")}>云服务器 CCI</button></div></div></div></section>
        <section className="panel resource-panel"><div className="panel-title"><div><h2>我的资源</h2><p>当前账户资源状态</p></div><button className="text-button" onClick={() => setSection("资源中心")}>资源管理</button></div><div className="resource-grid"><article><div><Globe2 size={19} /><span>弹性公网 IP</span></div><b>{instances.filter((item) => item.publicIp !== "未绑定").length}</b><small>已绑定公网地址</small></article><article><div><Network size={19} /><span>私有网络 VPC</span></div><b>{new Set(instances.map((item) => item.vpc).filter(Boolean)).size}</b><small>实例使用的网络</small></article><article><div><Server size={19} /><span>计算实例</span></div><b>{instances.length}</b><small>{instances.filter((item) => item.status === "运行中").length} 个运行中 · {instances.filter((item) => item.status === "已停止").length} 个已停止</small></article><article><div><Database size={19} /><span>存储卷</span></div><b>{instances.length}</b><small>随实例挂载的系统盘</small></article></div></section>
      </div>
      <aside className="home-rail">
        <section className="panel account-panel"><button className="panel-link" onClick={() => setSection("账号中心")}>账号中心<ChevronRight size={14} /></button><div className="account-row"><div className="account-avatar">{accountName.slice(0, 2).toUpperCase()}</div><div><b>{accountName}</b><span>根用户</span></div></div><p>账户标识：<strong>{accountName}</strong></p><div className="account-key"><span>访问密钥</span><b>API</b><button onClick={() => setSection("API 密钥")}>管理</button></div></section>
        <section className="panel finance-panel"><button className="panel-link" onClick={() => setSection("用量与账单")}>费用中心<ChevronRight size={14} /></button><span>可用余额</span><strong>{balance.toFixed(2)} <small>USDT</small></strong><button className="primary" onClick={onCharge}>充值</button><div className="finance-stats"><div><b className="danger">1</b><span>超期订单</span></div><div><b>0</b><span>即将到期</span></div><div><b>0</b><span>待支付</span></div></div></section>
        <section className="panel alerts-panel"><button className="panel-link" onClick={() => setSection("云监控")}>资源预警<ChevronRight size={14} /></button><div className="alert-stats"><div><b>0</b><span>紧急告警</span></div><div><b>0</b><span>重要告警</span></div><div><b>0</b><span>近 7 天</span></div></div><div className="health-line"><ShieldCheck size={17} /><span>所有监控项运行正常</span></div></section>
        <section className="panel message-panel"><div className="panel-title"><div><h2>产品消息</h2><p>最近通知</p></div><button className="text-button" onClick={() => setSection("消息中心")}>全部</button></div><div className="message-list">{messages.map(([type, text, time]) => <button key={text} onClick={() => setSection("消息中心")}><i /><span><b>{type}</b><small>{text}</small><time>{time}</time></span></button>)}</div></section>
        <section className="support-row"><button onClick={() => setSection("帮助中心")}><BookOpen size={17} />帮助文档</button><button onClick={() => setSection("帮助中心")}><Activity size={17} />服务支持</button></section>
      </aside>
    </div>
  </div>;
}
