import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, X } from "lucide-react";

export function PageHeader({ title, description, actions, eyebrow }: { title: string; description: string; actions?: ReactNode; eyebrow?: string }) {
  return <header className="page-header"><div><span>{eyebrow ?? "HEXBIT CLOUD"}</span><h1>{title}</h1><p>{description}</p></div>{actions && <div className="page-actions">{actions}</div>}</header>;
}
export function Panel({ title, description, action, children, className = "" }: { title?: string; description?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{(title || action) && <header className="panel-head"><div>{title && <h2>{title}</h2>}{description && <p>{description}</p>}</div>{action}</header>}{children}</section>;
}
export function Modal({ title, description, onClose, children, wide = false }: { title: string; description?: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => { const close = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={onClose}><section className={`modal ${wide ? "wide" : ""}`} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}><header><div><h2>{title}</h2>{description && <p>{description}</p>}</div><button className="icon-button" onClick={onClose} aria-label="关闭"><X size={18} /></button></header>{children}</section></div>;
}
export function Confirm({ title, message, confirmText = "确认", danger = true, onConfirm, onClose }: { title: string; message: string; confirmText?: string; danger?: boolean; onConfirm: () => void; onClose: () => void }) {
  return <Modal title={title} onClose={onClose}><div className="confirm-body"><AlertTriangle size={24} /><p>{message}</p></div><div className="modal-actions"><button className="button secondary" onClick={onClose}>取消</button><button className={`button ${danger ? "danger" : "primary"}`} onClick={onConfirm}>{confirmText}</button></div></Modal>;
}
export function EmptyState({ title = "暂无数据", description = "当前条件下没有可显示的数据。", action }: { title?: string; description?: string; action?: ReactNode }) { return <div className="empty-state"><CheckCircle2 size={28} /><strong>{title}</strong><span>{description}</span>{action}</div>; }
export function StatusBadge({ value }: { value: string }) {
  const success = ["running", "active", "successful", "available", "open", "approved", "已恢复", "成功", "in-use", "bound"].includes(value);
  const warn = ["creating", "pending", "paused", "stopped", "closed", "警告"].includes(value);
  const label: Record<string, string> = { running: "运行中", stopped: "已停止", creating: "创建中", error: "异常", active: "正常", disabled: "已禁用", successful: "交易成功", pending: "处理中", queued: "排队中", approved: "已通过", rejected: "已拒绝", open: "处理中", closed: "已关闭", cancelled: "已取消", available: "可用", "in-use": "使用中", bound: "已绑定", paused: "已暂停", revoked: "已撤销", never: "未执行", failed: "失败" };
  return <span className={`status ${success ? "success" : warn ? "warning" : "danger"}`}><i />{label[value] ?? value}</span>;
}
export function Tabs({ items, value, onChange }: { items: string[]; value: string; onChange: (value: string) => void }) { return <div className="tabs" role="tablist">{items.map((item) => <button key={item} className={item === value ? "active" : ""} onClick={() => onChange(item)}>{item}</button>)}</div>; }
export function Pagination({ total, page, pageSize = 8, onChange }: { total: number; page: number; pageSize?: number; onChange: (page: number) => void }) { const pages = Math.max(1, Math.ceil(total / pageSize)); return <footer className="pagination"><span>共 {total} 条</span><div><button disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="上一页"><ChevronLeft size={15} /></button><b>{page} / {pages}</b><button disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="下一页"><ChevronRight size={15} /></button></div></footer>; }
export function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: ReactNode }) { return <label className="field"><span>{label}{required && <em>*</em>}</span>{children}{hint && <small>{hint}</small>}</label>; }
export function Metric({ label, value, detail, tone = "blue" }: { label: string; value: string | number; detail: string; tone?: string }) { return <article className={`metric ${tone}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>; }
export function SearchEmpty({ query }: { query: string }) { return <EmptyState title={query ? "没有匹配结果" : "暂无数据"} description={query ? `没有找到与“${query}”匹配的项目，请调整搜索条件。` : undefined} />; }
export function useDisclosure() { const [open, setOpen] = useState(false); return { open, show: () => setOpen(true), hide: () => setOpen(false), setOpen }; }
