import { useState } from "react";

export function ModalSave({ onClose, onSave, disabled = false }: { onClose: () => void; onSave: () => void | Promise<void>; disabled?: boolean }) {
  const [saving, setSaving] = useState(false);
  return <div className="modal-actions"><button className="button secondary" disabled={saving} onClick={onClose}>取消</button><button className="button primary" disabled={disabled || saving} onClick={async () => { setSaving(true); try { await onSave(); } finally { setSaving(false); } }}>{saving ? "保存中..." : "保存"}</button></div>;
}
