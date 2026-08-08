"use client";

import { useMemo, useState } from "react";
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
  onBack: () => void;
  onNotice: (message: string) => void;
  onSubmit: (request: ServerCreateRequest) => void;
};

export type ServerCreateRequest = {
  serverName: string;
  spec: (typeof serverSpecs)[number];
  zone: string;
  vpc: string;
  privateIp: string | null;
  os: string;
  image: string;
  credential: "密码" | "密钥对";
  username: string;
  sshKey: string;
  storageCount: number;
  dnatCount: number;
  cloudInit: boolean;
  resourceGroup: string;
  quantity: number;
  duration: number;
  autoRenew: boolean;
};

const serverSpecs = [
  { code: "n2ss.re.a25", cpu: "AMD EPYC 7742", cores: "128 核", memory: "512 GB", gpu: "NVIDIA A100", cards: "8 卡", vram: "8 x 40 GB", price: 60000 },
  { code: "n2ss.n.a25", cpu: "AMD EPYC 7742", cores: "128 核", memory: "512 GB", gpu: "NVIDIA A100", cards: "8 卡", vram: "8 x 40 GB", price: 60000 },
];

export function CreateServerPage({ onBack, onNotice, onSubmit }: CreateServerPageProps) {
  const [zone, setZone] = useState("中国重庆二区 / 可用区 A");
  const [vpc, setVpc] = useState("vpc-zhejiangshengwang-enw25jpr");
  const [privateIpEnabled, setPrivateIpEnabled] = useState(false);
  const [privateIp, setPrivateIp] = useState("");
  const [spec, setSpec] = useState("");
  const [os, setOs] = useState("Ubuntu");
  const [image, setImage] = useState("Ubuntu 22.04 LTS 64位");
  const [credential, setCredential] = useState<"密码" | "密钥对">("密码");
  const [username, setUsername] = useState("root");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sshKey, setSshKey] = useState("hexbit-production");
  const [advancedOpen, setAdvancedOpen] = useState(true);
  const [storageCount, setStorageCount] = useState(0);
  const [dnatCount, setDnatCount] = useState(0);
  const [cloudInit, setCloudInit] = useState(false);
  const [resourceGroup, setResourceGroup] = useState("共享资源组 / default");
  const [serverName, setServerName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [duration, setDuration] = useState(1);
  const [autoRenew, setAutoRenew] = useState(true);
  const [agreement, setAgreement] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const selectedSpec = serverSpecs.find((item) => item.code === spec);
  const total = useMemo(() => (selectedSpec?.price ?? 0) * quantity * duration, [selectedSpec, quantity, duration]);
  const usernameValid = credential === "密钥对" || /^[A-Za-z_][A-Za-z0-9_-]{0,31}$/.test(username);
  const credentialsValid = credential === "密钥对" || (usernameValid && password.length >= 8 && password === confirmPassword);
  const privateIpValid = !privateIpEnabled || /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/.test(privateIp);
  const canSubmit = Boolean(selectedSpec && serverName.trim() && credentialsValid && privateIpValid && agreement && !submitted);

  const submit = () => {
    if (!canSubmit || !selectedSpec) return;
    setSubmitted(true);
    onSubmit({ serverName: serverName.trim(), spec: selectedSpec, zone, vpc, privateIp: privateIpEnabled ? privateIp : null, os, image, credential, username, sshKey, storageCount, dnatCount, cloudInit, resourceGroup, quantity, duration, autoRenew });
    onNotice(`服务器 ${serverName} 的购买配置已提交`);
  };

  return <div className="server-create-page">
    <header className="server-create-head">
      <button className="icon-button" aria-label="返回 GPU 服务器" title="返回" onClick={onBack}><ArrowLeft size={17} /></button>
      <div><span>GPU SERVER / PURCHASE</span><h2>购买裸金属服务器</h2><p>按配置创建 GPU 裸金属实例，并统一设置网络、镜像和登录凭证。</p></div>
    </header>

    <div className="server-create-layout">
      <div className="server-create-main">
        <ConfigSection title="基础配置" icon={<Server size={17} />}>
          <div className="config-row">
            <div className="config-label">计费模式</div>
            <div className="billing-choice selected"><span className="choice-mark"><Check size={14} /></span><span><b>按月计费</b><small>适用于短期灵活的业务需求</small></span></div>
          </div>
          <div className="config-row">
            <label className="config-label" htmlFor="server-zone">地区和可用区</label>
            <div className="config-fields inline-fields"><select id="server-zone" value={zone} onChange={(event) => setZone(event.target.value)}><option>中国重庆二区 / 可用区 A</option><option>中国重庆二区 / 可用区 B</option></select><select aria-label="VPC" value={vpc} onChange={(event) => setVpc(event.target.value)}><option>vpc-zhejiangshengwang-enw25jpr</option><option>vpc-default-cq02</option></select></div>
          </div>
            <div className="config-row compact-row">
            <div className="config-label">私有 IP</div>
            <div className="config-fields"><label className="check-control"><input type="checkbox" checked={privateIpEnabled} onChange={(event) => setPrivateIpEnabled(event.target.checked)} />指定私有 IP 地址</label>{privateIpEnabled && <input className="text-control" value={privateIp} onChange={(event) => setPrivateIp(event.target.value)} placeholder="例如 192.168.1.20" />}</div>
            </div>
            {!privateIpValid && <div className="purchase-warning">请输入有效的 IPv4 地址。</div>}
        </ConfigSection>

        <ConfigSection title="产品配置" icon={<CloudCog size={17} />}>
          <div className="config-row">
            <div className="config-label">产品类型</div>
            <div className="product-choice selected"><Check size={14} />弹性裸金属服务器 - GPU 类型</div>
          </div>
          <div className="config-row align-start">
            <div className="config-label">规格</div>
            <div className="server-spec-wrap"><div className="server-spec-head"><span /><span>规格编码</span><span>CPU 型号</span><span>物理核数</span><span>内存</span><span>GPU 型号</span><span>GPU 卡数</span><span>显存大小</span><span>价格</span></div>{serverSpecs.map((item) => <button className={`server-spec-row ${spec === item.code ? "selected" : ""}`} type="button" key={item.code} onClick={() => setSpec(item.code)}><span className="radio-mark">{spec === item.code && <i />}</span><strong>{item.code}</strong><span>{item.cpu}</span><span>{item.cores}</span><span>{item.memory}</span><span>{item.gpu}</span><span>{item.cards}</span><span>{item.vram}</span><b>¥ {item.price.toLocaleString("zh-CN")}.00</b></button>)}</div>
          </div>
          {!usernameValid && <div className="purchase-warning">用户名需以字母或下划线开头，仅支持字母、数字、下划线和连字符。</div>}
          <div className="config-row compact-row"><div className="config-label">本地磁盘</div><div className="inline-summary"><HardDrive size={15} />系统盘 480 GB NVMe</div></div>
          <div className="config-row compact-row"><div className="config-label">网络</div><div className="inline-summary"><Network size={15} />25 Gbps 高速网络</div></div>
          <div className="config-row">
            <div className="config-label">镜像配置</div>
            <div className="config-fields"><div className="form-tabs"><span className="active">官方镜像</span></div><div className="inline-fields"><select aria-label="操作系统" value={os} onChange={(event) => { setOs(event.target.value); setImage(event.target.value === "Ubuntu" ? "Ubuntu 22.04 LTS 64位" : "CentOS 7.9 64位"); }}><option>Ubuntu</option><option>CentOS</option></select><select aria-label="镜像" value={image} onChange={(event) => setImage(event.target.value)}>{os === "Ubuntu" ? <><option>Ubuntu 22.04 LTS 64位</option><option>Ubuntu 20.04 LTS 64位</option></> : <><option>CentOS 7.9 64位</option><option>CentOS Stream 9 64位</option></>}</select></div></div>
          </div>
          <div className="config-row align-start">
            <div className="config-label">登录凭证</div>
            <div className="config-fields"><div className="form-tabs"><button type="button" className={credential === "密码" ? "active" : ""} onClick={() => setCredential("密码")}><Terminal size={14} />密码</button><button type="button" className={credential === "密钥对" ? "active" : ""} onClick={() => setCredential("密钥对")}><KeyRound size={14} />密钥对</button></div>{credential === "密码" ? <div className="credential-grid"><label>用户名<input value={username} onChange={(event) => setUsername(event.target.value)} /></label><label>密码<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="至少 8 个字符" /></label><label>确认密码<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="再次输入密码" /></label></div> : <label className="stacked-field">密钥对<select value={sshKey} onChange={(event) => setSshKey(event.target.value)}><option>hexbit-production</option><option>hexbit-backup</option></select></label>}</div>
          </div>
          <div className="config-row compact-row"><div className="config-label">云助手</div><div className="inline-summary"><Check size={15} />默认安装云助手</div></div>
          <div className="config-row compact-row"><div className="config-label">安全加固</div><div className="inline-summary"><ShieldCheck size={15} />已开通主机安全</div></div>
        </ConfigSection>

        <section className="config-section advanced-section">
          <button className="advanced-toggle" type="button" aria-expanded={advancedOpen} onClick={() => setAdvancedOpen((current) => !current)}><span>高级配置 <small>选填</small></span>{advancedOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
          {advancedOpen && <div className="advanced-body">
            <div className="config-row align-start"><div className="config-label">文件存储挂载</div><div className="config-fields"><button className="outline-button" type="button" disabled={storageCount >= 10} onClick={() => setStorageCount((value) => Math.min(10, value + 1))}><Plus size={14} />添加存储卷 ({storageCount}/10)</button>{storageCount > 0 && <div className="attachment-list">{Array.from({ length: storageCount }).map((_, index) => <span key={index}><HardDrive size={14} />afs-prod-{index + 1}<button aria-label={`移除存储卷 ${index + 1}`} onClick={() => setStorageCount((value) => Math.max(0, value - 1))}>移除</button></span>)}</div>}<small>支持挂载最多 10 个文件存储，无法挂载到系统目录。</small></div></div>
            <div className="config-row align-start"><div className="config-label">绑定 DNAT 规则</div><div className="config-fields"><button className="outline-button" type="button" disabled={dnatCount >= 50} onClick={() => setDnatCount((value) => Math.min(50, value + 1))}><Plus size={14} />添加 DNAT 规则 ({dnatCount}/50)</button>{dnatCount > 0 && <div className="attachment-list"><span><Network size={14} />公网入口规则 x {dnatCount}<button aria-label="清空 DNAT 规则" onClick={() => setDnatCount(0)}>清空</button></span></div>}<small>支持绑定最多 50 个 DNAT 规则。</small></div></div>
            <div className="config-row compact-row"><div className="config-label">Cloud-Init</div><label className="switch-control"><input type="checkbox" checked={cloudInit} onChange={(event) => setCloudInit(event.target.checked)} /><span />{cloudInit ? "已启用" : "未启用"}</label></div>
          </div>}
        </section>

        <ConfigSection title="其他配置" icon={<ShieldCheck size={17} />}>
          <div className="config-row"><label className="config-label" htmlFor="resource-group">资源组</label><select id="resource-group" className="standalone-select" value={resourceGroup} onChange={(event) => setResourceGroup(event.target.value)}><option>共享资源组 / default</option><option>生产资源组 / inference</option></select></div>
          <div className="config-row compact-row"><div className="config-label">计费账户</div><div className="account-share"><span>账户名称<b>zhejiangshengwang</b></span><span>分摊比例<b>100%</b></span></div></div>
          <div className="config-row"><label className="config-label" htmlFor="server-name">服务器名称</label><div className="config-fields"><input id="server-name" className="text-control" value={serverName} onChange={(event) => setServerName(event.target.value)} placeholder="请输入资源显示名称" /><small>批量创建时系统自动添加有序后缀。</small></div></div>
        </ConfigSection>
      </div>

      <aside className="purchase-summary">
        <div className="purchase-controls"><label>购买实例个数<div className="number-stepper"><button aria-label="减少实例数量" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus size={14} /></button><b>{quantity}</b><button aria-label="增加实例数量" disabled={quantity >= 10} onClick={() => setQuantity((value) => Math.min(10, value + 1))}><Plus size={14} /></button></div></label><label>购买时长<div className="duration-control"><input type="number" min="1" max="120" value={duration} onChange={(event) => setDuration(Math.min(120, Math.max(1, Number(event.target.value) || 1)))} /><span>个月</span></div></label><label className="renew-line">自动续订<input type="checkbox" checked={autoRenew} onChange={(event) => setAutoRenew(event.target.checked)} /></label></div>
        <div className="summary-block"><h3>配置信息</h3><SummaryLine label="计费模式" value="按月计费" /><SummaryLine label="地区和可用区" value={zone.replace(" / ", "-")} /><SummaryLine label="VPC" value={vpc} /><SummaryLine label="产品类型" value="弹性裸金属服务器 - GPU 类型" /><SummaryLine label="规格" value={selectedSpec?.code ?? "-"} /><SummaryLine label="本地磁盘" value={selectedSpec ? "480 GB NVMe" : "-"} /><SummaryLine label="网络" value={selectedSpec ? "25 Gbps" : "-"} /><SummaryLine label="镜像配置" value={`${os} / ${image}`} /><SummaryLine label="登录凭证" value={credential === "密码" ? username : sshKey} /><SummaryLine label="云助手" value="默认安装" /><SummaryLine label="主机安全" value="已开通" /><SummaryLine label="挂载存储卷" value={`${storageCount} 个`} /><SummaryLine label="绑定 DNAT 规则" value={`${dnatCount} 个`} /><SummaryLine label="Cloud-Init" value={cloudInit ? "已启用" : "-"} /><SummaryLine label="资源组" value={resourceGroup} /><SummaryLine label="服务器名称" value={serverName || "-"} /></div>
        <div className="purchase-total"><span>配置费用</span><strong><small>¥</small>{total.toLocaleString("zh-CN")}<i>.00</i></strong><p>{selectedSpec ? `¥ ${selectedSpec.price.toLocaleString("zh-CN")} / 台 / 月` : "请选择服务器规格"}</p></div>
        <label className="agreement-line"><input type="checkbox" checked={agreement} onChange={(event) => setAgreement(event.target.checked)} />我已阅读并同意《平台用户服务协议》</label>
        {!credentialsValid && credential === "密码" && (password || confirmPassword) && <div className="purchase-warning">密码至少 8 个字符，且两次输入必须一致。</div>}
        <button className="primary purchase-button" disabled={!canSubmit} onClick={submit}><ShoppingCart size={16} />{submitted ? "正在提交" : "立即购买"}</button>
      </aside>
    </div>
  </div>;
}

function ConfigSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <section className="config-section"><header>{icon}<h3>{title}</h3></header><div className="config-section-body">{children}</div></section>;
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return <div className="summary-line"><span>{label}</span><b title={value}>{value}</b></div>;
}
