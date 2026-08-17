import { useState } from "react";
import { Field, Modal } from "./ui";
import { ModalSave } from "./FormActions";

interface SimpleRequestModalProps {
  title: string;
  fields: string[];
  onClose: () => void;
  onSubmit: (values: string[]) => void | Promise<void>;
}

export function SimpleRequestModal({ title, fields, onClose, onSubmit }: SimpleRequestModalProps) {
  const [values, setValues] = useState(fields.map(() => ""));

  return (
    <Modal title={title} onClose={onClose}>
      <div className="form-grid single">
        {fields.map((field, index) => (
          <Field key={field} label={field} required>
            {index === fields.length - 1 ? (
              <textarea
                value={values[index]}
                onChange={(event) => setValues(values.map((value, itemIndex) => itemIndex === index ? event.target.value : value))}
              />
            ) : (
              <input
                value={values[index]}
                onChange={(event) => setValues(values.map((value, itemIndex) => itemIndex === index ? event.target.value : value))}
              />
            )}
          </Field>
        ))}
      </div>
      <ModalSave
        disabled={values.some((value) => !value.trim())}
        onClose={onClose}
        onSave={() => onSubmit(values.map((value) => value.trim()))}
      />
    </Modal>
  );
}
