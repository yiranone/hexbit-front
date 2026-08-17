import { useState } from "react";
import { id, useConsoleStore } from "../../../store";
import type { PublicIp } from "../../../domain";
import { Field, Modal, ModalSave } from "../../../shared";


export function PublicIpModal({ value, onClose }: { value: PublicIp | "new"; onClose: () => void }) { const { mutate } = useConsoleStore(); const [bandwidth, setBandwidth] = useState(value === "new" ? 20 : value.bandwidth); return <Modal title={value === "new" ? "申请公网 IP" : "编辑公网 IP 带宽"} onClose={onClose}><Field label="带宽 (Mbps)" required hint="可设置 1-200 Mbps"><input type="number" min="1" max="200" value={bandwidth} onChange={(e) => setBandwidth(Number(e.target.value))} /></Field><ModalSave disabled={bandwidth < 1 || bandwidth > 200} onClose={onClose} onSave={async () => { const saved = await mutate((s) => ({ ...s, publicIps: value === "new" ? [{ id: id("eip"), address: `103.91.209.${Math.floor(Math.random() * 180 + 30)}`, bandwidth, status: "available" }, ...s.publicIps] : s.publicIps.map((ip) => ip.id === value.id ? { ...ip, bandwidth } : ip) }), value === "new" ? "公网 IP 已申请" : "公网 IP 带宽已更新"); if (saved) onClose(); }} /></Modal>; }
