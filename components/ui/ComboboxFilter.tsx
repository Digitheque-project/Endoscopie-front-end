"use client";

import { useEffect, useRef, useState } from "react";

interface ComboboxFilterProps {
  label: string;
  icon?: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}

/** Filtre texte libre avec suggestions : montre les valeurs connues mais accepte aussi une saisie libre. */
export default function ComboboxFilter({
  label,
  icon,
  value,
  onChange,
  options,
  placeholder,
}: ComboboxFilterProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open]);

  const suggestions = options.filter((opt) =>
    opt.toLowerCase().includes(value.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">
            {icon}
          </span>
        )}
        <input
          className={`w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg ${icon ? "pl-9" : "pl-3"} pr-4 py-2 text-xs font-medium focus:ring-2 focus:ring-primary/20 text-on-surface`}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setOpen(true)}
        />
        {open && suggestions.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-outline-variant/20 bg-white shadow-lg">
            {suggestions.map((opt) => (
              <li key={opt}>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-xs font-medium text-on-surface hover:bg-surface-container"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                >
                  {opt}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
