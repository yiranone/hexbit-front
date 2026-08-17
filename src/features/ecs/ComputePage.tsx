import { useNavigate } from "react-router-dom";
import { Cpu, Plus } from "lucide-react";
import { PageHeader, Panel } from "../../shared";
import { instanceOfferings as offerings } from "./catalog";

export function ComputePage() { const navigate = useNavigate(); return <><PageHeader title="云服务器" description="按业务负载选择合适的计算规格，按量或包月使用。" actions={<button className="button primary" onClick={() => navigate("/instances/new")}><Plus size={16} />创建云服务器</button>} /><Panel><div className="offering-grid">{offerings.map((item) => <article key={item.name}><div className="offering-icon"><Cpu size={22} /></div><h2>{item.name}</h2><p>{item.note}</p><div className="offering-spec"><span><b>{item.cpu}</b> vCPU</span><span><b>{item.memory} GB</b> 内存</span><span><b>{item.gpu}</b> GPU</span></div><strong>{item.price.toFixed(2)} <small>USDT / 小时起</small></strong><button className="button primary" onClick={() => navigate("/instances/new", { state: item })}>立即创建</button></article>)}</div></Panel></>; }
