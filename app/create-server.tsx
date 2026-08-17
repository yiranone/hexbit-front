"use client";

import { useMemo, useState } from "react";
import type { ApiOffering, ApiOrder, ApiResourceGroup } from "../src/api";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  CloudCog,
  HardDrive,
  KeyRound,
  Minus,
  Network,
  Plus,
  Server,
  ShieldCheck,
  ShoppingCart,
  Terminal,
} from "lucide-react";

type CreateServerPageProps = {
  accountName: string;
  balance: number;
  offerings: ApiOffering[];
  resourceGroups: ApiResourceGroup[];
  initialOfferingId?: string;
  loading: boolean;
  loadError: string;
  onBack: () => void;
  onCharge: () => void;
  onReload: () => void;
  onCreateOrder: (request: ServerCreateRequest) => Promise<ApiOrder>;
  onPayOrder: (order: ApiOrder) => Promise<void>;
};

export type ServerCreateRequest = {
  serverName: string;
  spec: ApiOffering;
  vpc: string;
  privateIp: string | null;
  image: string;
  resourceGroup: string;
  quantity: number;
  duration: number;
  autoRenew: boolean;
};

function formatNetwork(mbps: number) {
  return mbps >= 1000 ? `${mbps / 1000} Gbps` : `${mbps} Mbps`;
}

export function CreateServerPage({ accountName, balance, offerings, resourceGroups, initialOfferingId, loading, loadError, onBack, onCharge, onReload, onCreateOrder, onPayOrder }: CreateServerPageProps) {
  const [spec, setSpec] = useState(initialOfferingId ?? "");
  const [vpc, setVpc] = useState("default");
  const [privateIpEnabled, setPrivateIpEnabled] = useState(false);
  const [privateIp, setPrivateIp] = useState("");
  const [os, setOs] = useState("Ubuntu");
  const [image, setImage] = useState("Ubuntu 24.04 LTS 64位");
  const [credential, setCredential] = useState<"密码" | "密钥对">("密码");
  const [username, setUsername] = useState("root");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sshKey, setSshKey] = useState("hexbit-production");
  const [advancedOpen, setAdvancedOpen] = useState(true);
  const [storageCount, setStorageCount] = useState(0);
  const [dnatCount, setDnatCount] = useState(0);
  const [cloudInit, setCloudInit] = useState(false);
  const [resourceGroup, setResourceGroup] = useState("");
  const [serverName, setServerName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [duration, setDuration] = useState(1);
  const [autoRenew, setAutoRenew] = useState(true);
  const [agreement, setAgreement] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [pendingOrder, setPendingOrder] = useState<ApiOrder | null>(null);
  const [paying, setPaying] = useState(false);

  const selectedSpec = offerings.find((item) => item.id === spec)
    ?? offerings.find((item) => item.id === initialOfferingId)
    ?? offerings[0];
  const selectedResourceGroup = resourceGroup || resourceGroups[0]?.name || "";
  const total = useMemo(() => (selectedSpec?.price_monthly ?? 0) * quantity * duration, [selectedSpec, quantity, duration]);
  const usernameValid = credential === "密钥对" || /^[A-Za-z_][A-Za-z0-9_-]{0,31}$/.test(username);
  const credentialsValid = credential === "密钥对" || (usernameValid && password.length >= 8 && password === confirmPassword);
  const privateIpValid = !privateIpEnabled || /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/.test(privateIp);
  const hasFunds = Boolean(selectedSpec && balance >= total);
  const canSubmit = Boolean(selectedSpec && selectedSpec.stock >= quantity && serverName.trim() && credentialsValid && privateIpValid && selectedResourceGroup && agreement && hasFunds && !submitted);

  const submit = async () => {
    if (!canSubmit || !selectedSpec) return;
    setSubmitted(true);
    setSubmitError("");
    try {
      const order = await onCreateOrder({ serverName: serverName.trim(), spec: selectedSpec, vpc, privateIp: privateIpEnabled ? privateIp : null, image, resourceGroup: selectedResourceGroup, quantity, duration, autoRenew });
      setPendingOrder(order);
      setSubmitted(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "购买失败，请稍后重试");
      setSubmitted(false);
    }
  };

  if (pendingOrder) return <OrderConfirmation order={pendingOrder} balance={balance} paying={paying} error={submitError} onBack={() => { setPendingOrder(null); setSubmitError(""); }} onCharge={onCharge} onPay={async () => {
    setPaying(true);
    setSubmitError("");
    try {
      await onPayOrder(pendingOrder);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "支付失败，请稍后重试");
      setPaying(false);
    }
  }} />;

  return <div className="server-create-page">
    <header className="server-create-head">
      <button className="icon-button" aria-label="返回 GPU 服务器" title="返回" onClick={onBack}><ArrowLeft size={17} /></button>
      <div><span>GPU SERVER / PURCHASE</span><h2>购买 GPU 服务器</h2><p>规格、库存和价格实时读取后台，购买成功后写入实例与账单。</p></div>
    </header>

    <div className="server-create-layout">
      <div className="server-create-main">
        <ConfigSection title="基础配置" icon={<Server size={17} />}>
          <div className="config-row"><div className="config-label">计费模式</div><div className="billing-choice selected"><span className="choice-mark"><Check size={14} /></span><span><b>按月计费</b><small>从账户 USDT 余额即时扣款</small></span></div></div>
          <div className="config-row"><div className="config-label">地区和可用区</div><div className="inline-summary">{selectedSpec ? `${selectedSpec.region} / ${selectedSpec.zone}` : "选择规格后自动确定"}</div></div>
          <div className="config-row"><label className="config-label" htmlFor="server-vpc">VPC</label><select id="server-vpc" className="standalone-select" value={vpc} onChange={(event) => setVpc(event.target.value)}><option value="default">default</option></select></div>
          <div className="config-row compact-row"><div className="config-label">私有 IP</div><div className="config-fields"><label className="check-control"><input type="checkbox" checked={privateIpEnabled} onChange={(event) => setPrivateIpEnabled(event.target.checked)} />指定私有 IP 地址</label>{privateIpEnabled && <input className="text-control" value={privateIp} onChange={(event) => setPrivateIp(event.target.value)} placeholder="例如 192.168.1.20" />}</div></div>
          {!privateIpValid && <div className="purchase-warning">请输入有效的 IPv4 地址。</div>}
        </ConfigSection>

        <ConfigSection title="产品配置" icon={<CloudCog size={17} />}>
          <div className="config-row"><div className="config-label">产品类型</div><div className="product-choice selected"><Check size={14} />GPU 服务器</div></div>
          <div className="config-row align-start">
            <div className="config-label">规格</div>
            <div className="config-fields spec-fields">
              {loading && <div className="purchase-status">正在从后台读取 GPU 规格...</div>}
              {loadError && <div className="purchase-error">{loadError}<button type="button" onClick={onReload}>重新加载</button></div>}
              {!loading && !loadError && <div className="server-spec-wrap"><div className="server-spec-head"><span /><span>规格编码</span><span>CPU 型号</span><span>vCPU</span><span>内存</span><span>GPU 型号</span><span>GPU 卡数</span><span>显存</span><span>月价</span></div>{offerings.map((item) => <button className={`server-spec-row ${selectedSpec?.id === item.id ? "selected" : ""}`} type="button" key={item.id} disabled={item.stock === 0} onClick={() => setSpec(item.id)}><span className="radio-mark">{selectedSpec?.id === item.id && <i />}</span><strong>{item.id}</strong><span>{item.cpu_model}</span><span>{item.vcpu}</span><span>{item.memory_gib} GB</span><span>{item.gpu_model ?? item.name}</span><span>{item.gpu_count}</span><span>{item.gpu_memory_gib} GB</span><b>{item.currency} {(item.price_monthly ?? 0).toFixed(2)}</b></button>)}</div>}
            </div>
          </div>
          <div className="config-row compact-row"><div className="config-label">本地磁盘</div><div className="inline-summary"><HardDrive size={15} />{selectedSpec ? `${selectedSpec.disk_gib} GB NVMe` : "-"}</div></div>
          <div className="config-row compact-row"><div className="config-label">网络</div><div className="inline-summary"><Network size={15} />{selectedSpec ? formatNetwork(selectedSpec.network_mbps) : "-"}</div></div>
          <div className="config-row"><div className="config-label">镜像配置</div><div className="config-fields"><div className="form-tabs"><span className="active">官方镜像</span></div><div className="inline-fields"><select aria-label="操作系统" value={os} onChange={(event) => { setOs(event.target.value); setImage(event.target.value === "Ubuntu" ? "Ubuntu 24.04 LTS 64位" : "Rocky Linux 9 64位"); }}><option>Ubuntu</option><option>Rocky Linux</option></select><select aria-label="镜像" value={image} onChange={(event) => setImage(event.target.value)}>{os === "Ubuntu" ? <><option>Ubuntu 24.04 LTS 64位</option><option>Ubuntu 22.04 LTS 64位</option></> : <option>Rocky Linux 9 64位</option>}</select></div></div></div>
          <div className="config-row align-start"><div className="config-label">登录凭证</div><div className="config-fields"><div className="form-tabs"><button type="button" className={credential === "密码" ? "active" : ""} onClick={() => setCredential("密码")}><Terminal size={14} />密码</button><button type="button" className={credential === "密钥对" ? "active" : ""} onClick={() => setCredential("密钥对")}><KeyRound size={14} />密钥对</button></div>{credential === "密码" ? <div className="credential-grid"><label>用户名<input value={username} onChange={(event) => setUsername(event.target.value)} /></label><label>密码<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="至少 8 个字符" /></label><label>确认密码<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="再次输入密码" /></label></div> : <label className="stacked-field">密钥对<select value={sshKey} onChange={(event) => setSshKey(event.target.value)}><option>hexbit-production</option><option>hexbit-backup</option></select></label>}</div></div>
          <div className="config-row compact-row"><div className="config-label">云助手</div><div className="inline-summary"><Check size={15} />默认安装云助手</div></div>
          <div className="config-row compact-row"><div className="config-label">安全加固</div><div className="inline-summary"><ShieldCheck size={15} />已开通主机安全</div></div>
        </ConfigSection>

        <section className="config-section advanced-section"><button className="advanced-toggle" type="button" aria-expanded={advancedOpen} onClick={() => setAdvancedOpen((current) => !current)}><span>高级配置 <small>选填</small></span>{advancedOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>{advancedOpen && <div className="advanced-body"><div className="config-row align-start"><div className="config-label">文件存储挂载</div><div className="config-fields"><button className="outline-button" type="button" disabled={storageCount >= 10} onClick={() => setStorageCount((value) => Math.min(10, value + 1))}><Plus size={14} />添加存储卷 ({storageCount}/10)</button><small>支持挂载最多 10 个文件存储。</small></div></div><div className="config-row align-start"><div className="config-label">绑定 DNAT 规则</div><div className="config-fields"><button className="outline-button" type="button" disabled={dnatCount >= 50} onClick={() => setDnatCount((value) => Math.min(50, value + 1))}><Plus size={14} />添加 DNAT 规则 ({dnatCount}/50)</button><small>支持绑定最多 50 个 DNAT 规则。</small></div></div><div className="config-row compact-row"><div className="config-label">Cloud-Init</div><label className="switch-control"><input type="checkbox" checked={cloudInit} onChange={(event) => setCloudInit(event.target.checked)} /><span />{cloudInit ? "已启用" : "未启用"}</label></div></div>}</section>

        <ConfigSection title="其他配置" icon={<ShieldCheck size={17} />}>
          <div className="config-row"><label className="config-label" htmlFor="resource-group">资源组</label><select id="resource-group" className="standalone-select" value={selectedResourceGroup} onChange={(event) => setResourceGroup(event.target.value)}>{resourceGroups.map((item) => <option key={item.name} value={item.name}>{item.name}{item.description ? ` / ${item.description}` : ""}</option>)}</select></div>
          <div className="config-row compact-row"><div className="config-label">计费账户</div><div className="account-share"><span>账户名称<b>{accountName}</b></span><span>可用余额<b>{balance.toFixed(2)} USDT</b></span></div></div>
          <div className="config-row"><label className="config-label" htmlFor="server-name">服务器名称</label><div className="config-fields"><input id="server-name" className="text-control" value={serverName} onChange={(event) => setServerName(event.target.value)} placeholder="请输入资源显示名称" /><small>批量创建时系统自动添加有序后缀。</small></div></div>
        </ConfigSection>
      </div>

      <aside className="purchase-summary">
        <div className="purchase-controls"><label>购买实例个数<div className="number-stepper"><button aria-label="减少实例数量" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus size={14} /></button><b>{quantity}</b><button aria-label="增加实例数量" disabled={!selectedSpec || quantity >= Math.min(10, selectedSpec.stock)} onClick={() => setQuantity((value) => Math.min(10, selectedSpec?.stock ?? 1, value + 1))}><Plus size={14} /></button></div></label><label>购买时长<div className="duration-control"><input type="number" min="1" max="120" value={duration} onChange={(event) => setDuration(Math.min(120, Math.max(1, Number(event.target.value) || 1)))} /><span>个月</span></div></label><label className="renew-line">自动续订<input type="checkbox" checked={autoRenew} onChange={(event) => setAutoRenew(event.target.checked)} /></label></div>
        <div className="summary-block"><h3>配置信息</h3><SummaryLine label="计费模式" value="按月计费" /><SummaryLine label="地区和可用区" value={selectedSpec ? `${selectedSpec.region} / ${selectedSpec.zone}` : "-"} /><SummaryLine label="VPC" value={vpc} /><SummaryLine label="规格" value={selectedSpec?.id ?? "-"} /><SummaryLine label="库存" value={selectedSpec ? `${selectedSpec.stock} 台` : "-"} /><SummaryLine label="本地磁盘" value={selectedSpec ? `${selectedSpec.disk_gib} GB NVMe` : "-"} /><SummaryLine label="网络" value={selectedSpec ? formatNetwork(selectedSpec.network_mbps) : "-"} /><SummaryLine label="镜像配置" value={image} /><SummaryLine label="登录凭证" value={credential === "密码" ? username : sshKey} /><SummaryLine label="资源组" value={selectedResourceGroup || "-"} /><SummaryLine label="服务器名称" value={serverName || "-"} /></div>
        <div className="purchase-total"><span>配置费用</span><strong><small>{selectedSpec?.currency ?? "USDT"}</small>{total.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong><p>{selectedSpec ? `${selectedSpec.currency} ${(selectedSpec.price_monthly ?? 0).toFixed(2)} / 台 / 月` : "请选择服务器规格"}</p></div>
        <label className="agreement-line"><input type="checkbox" checked={agreement} onChange={(event) => setAgreement(event.target.checked)} />我已阅读并同意《平台用户服务协议》</label>
        {!credentialsValid && credential === "密码" && (password || confirmPassword) && <div className="purchase-warning">密码至少 8 个字符，且两次输入必须一致。</div>}
        {selectedSpec && !hasFunds && <div className="purchase-error">余额不足，需要 {total.toFixed(2)} USDT，当前 {balance.toFixed(2)} USDT。<button type="button" onClick={onCharge}>去充值</button></div>}
        {submitError && <div className="purchase-error">{submitError}</div>}
        <button className="primary purchase-button" disabled={!canSubmit} onClick={submit}><ShoppingCart size={16} />{submitted ? "正在生成订单" : "确认订单"}</button>
      </aside>
    </div>
  </div>;
}

function OrderConfirmation({ order, balance, paying, error, onBack, onCharge, onPay }: { order: ApiOrder; balance: number; paying: boolean; error: string; onBack: () => void; onCharge: () => void; onPay: () => void }) {
  const enough = balance >= order.final_amount;
  const status = order.status === "pending_payment" ? "待支付" : "处理中";
  return <div className="order-confirm-page">
    <header className="server-create-head"><button className="icon-button" aria-label="返回配置" title="返回" onClick={onBack}><ArrowLeft size={17} /></button><div><span>ORDER / CONFIRMATION</span><h2>确认订单</h2><p>核对订单信息并使用账户余额完成支付。</p></div></header>
    <div className="order-confirm-layout">
      <section className="config-section order-confirm-card"><header><ShoppingCart size={17} /><h3>订单信息</h3><span className="order-status pending">{status}</span></header><div className="order-confirm-grid"><SummaryLine label="订单编号" value={order.id} /><SummaryLine label="资源名称" value={order.resource_name} /><SummaryLine label="产品规格" value={`${order.offering_name} / ${order.offering_id}`} /><SummaryLine label="地区和可用区" value={`${order.region} / ${order.zone}`} /><SummaryLine label="计费模式" value={order.billing_mode === "monthly" ? `包月 · ${order.duration} 个月` : `按量 · ${order.duration} 小时`} /><SummaryLine label="购买数量" value={`${order.quantity} 台`} /><SummaryLine label="创建时间" value={new Date(order.created_at).toLocaleString("zh-CN")} /></div></section>
      <aside className="order-payment-card"><h3>支付信息</h3><div className="payment-method selected"><span className="choice-mark"><Check size={14} /></span><div><b>账户余额</b><small>可用 {balance.toFixed(2)} USDT</small></div></div><div className="order-amount"><span>订单原价</span><b>{order.currency} {order.original_amount.toFixed(2)}</b><span>优惠金额</span><b>- {order.currency} {order.discount_amount.toFixed(2)}</b><strong>应付金额</strong><em>{order.currency} {order.final_amount.toFixed(2)}</em></div>{!enough && <div className="purchase-error">余额不足。<button type="button" onClick={onCharge}>去充值</button></div>}{error && <div className="purchase-error">{error}</div>}<button className="primary purchase-button" disabled={!enough || paying} onClick={onPay}><ShoppingCart size={16} />{paying ? "正在支付" : "立即支付"}</button></aside>
    </div>
  </div>;
}

function ConfigSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <section className="config-section"><header>{icon}<h3>{title}</h3></header><div className="config-section-body">{children}</div></section>;
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return <div className="summary-line"><span>{label}</span><b title={value}>{value}</b></div>;
}
