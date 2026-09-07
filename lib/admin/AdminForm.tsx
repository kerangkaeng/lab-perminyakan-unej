"use client";

import { FieldConfig } from "@/lib/admin/config";

interface Option {
  value: string;
  label: string;
}

export function AdminForm({
  fields,
  initialData,
  action,
  relationOptions,
  submitLabel = "Simpan",
}: {
  fields: FieldConfig[];
  initialData?: Record<string, any>;
  action: (formData: FormData) => void;
  relationOptions?: Record<string, Option[]>;
  submitLabel?: string;
}) {
  return (
    <form action={action} className="space-y-6 max-w-2xl">
      {fields.map((field) => {
        const value = initialData?.[field.name];

        if (field.type === "textarea") {
          return (
            <div key={field.name}>
              <label className="block text-sm font-medium mb-1">{field.label}</label>
              <textarea name={field.name} defaultValue={value ?? ""} required={field.required} rows={4}
                className="w-full border border-line px-3 py-2 text-sm" />
            </div>
          );
        }
        if (field.type === "number") {
          return (
            <div key={field.name}>
              <label className="block text-sm font-medium mb-1">{field.label}</label>
              <input type="number" name={field.name} defaultValue={value ?? ""} required={field.required}
                className="w-full border border-line px-3 py-2 text-sm" />
            </div>
          );
        }
        if (field.type === "date") {
          return (
            <div key={field.name}>
              <label className="block text-sm font-medium mb-1">{field.label}</label>
              <input type="date" name={field.name} defaultValue={value ?? ""} required={field.required}
                className="w-full border border-line px-3 py-2 text-sm" />
            </div>
          );
        }
        if (field.type === "checkbox") {
          return (
            <div key={field.name} className="flex items-center gap-2">
              <input type="checkbox" name={field.name} defaultChecked={!!value} id={field.name} />
              <label htmlFor={field.name} className="text-sm font-medium">{field.label}</label>
            </div>
          );
        }
        if (field.type === "select") {
          return (
            <div key={field.name}>
              <label className="block text-sm font-medium mb-1">{field.label}</label>
              <select name={field.name} defaultValue={value ?? ""} required={field.required}
                className="w-full border border-line px-3 py-2 text-sm bg-paper">
                <option value="">— pilih —</option>
                {(field.options ?? []).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          );
        }
        if (field.type === "relation") {
          const opts = relationOptions?.[field.name] ?? [];
          return (
            <div key={field.name}>
              <label className="block text-sm font-medium mb-1">{field.label}</label>
              <select name={field.name} defaultValue={value ?? ""}
                className="w-full border border-line px-3 py-2 text-sm bg-paper">
                <option value="">— Alat Umum (tanpa lab) —</option>
                {opts.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          );
        }
        if (field.type === "tags") {
          return (
            <div key={field.name}>
              <label className="block text-sm font-medium mb-1">
                {field.label} <span className="text-xs text-core">(pisahkan dengan koma)</span>
              </label>
              <input type="text" name={field.name} defaultValue={(value ?? []).join(", ")}
                className="w-full border border-line px-3 py-2 text-sm" />
            </div>
          );
        }
        if (field.type === "image" || field.type === "pdf" || field.type === "file") {
          const accept = field.type === "image" ? "image/*" : field.type === "pdf" ? "application/pdf" : undefined;
          return (
            <div key={field.name}>
              <label className="block text-sm font-medium mb-1">{field.label}</label>
              {value && (
                <p className="text-xs text-core mb-2">
                  File saat ini:{" "}
                  <a href={value} target="_blank" rel="noopener noreferrer" className="text-petrol underline">
                    Lihat
                  </a>
                </p>
              )}
              <input type="file" name={field.name} accept={accept}
                className="w-full border border-line px-3 py-2 text-sm" />
              <input type="hidden" name={`${field.name}__existing`} defaultValue={value ?? ""} />
            </div>
          );
        }
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium mb-1">{field.label}</label>
            <input type="text" name={field.name} defaultValue={value ?? ""} required={field.required}
              className="w-full border border-line px-3 py-2 text-sm" />
          </div>
        );
      })}

      <button type="submit" className="bg-petrol text-paper px-6 py-3 text-sm font-medium hover:bg-petrol-light transition-colors">
        {submitLabel}
      </button>
    </form>
  );
}
