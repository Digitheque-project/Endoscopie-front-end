"use client";

type Option = { value: string; label: string };

interface SelectFilterProps {
  label: string;
  icon?: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
}

/** Filtre à choix fermé : l'utilisateur sélectionne uniquement parmi les valeurs connues. */
export default function SelectFilter({
  label,
  icon,
  value,
  onChange,
  options,
  placeholder = "Tous",
}: SelectFilterProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant pointer-events-none">
            {icon}
          </span>
        )}
        <select
          className={`w-full appearance-none bg-surface-container-lowest border border-outline-variant/30 rounded-lg ${icon ? "pl-9" : "pl-3"} pr-8 py-2 text-xs font-medium focus:ring-2 focus:ring-primary/20 text-on-surface`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant pointer-events-none">
          expand_more
        </span>
      </div>
    </div>
  );
}
