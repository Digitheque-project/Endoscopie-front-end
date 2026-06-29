"use client";

import React from 'react';
import { FieldDefinition } from '@/lib/config/endoscopyTypes';
import { useEndoscopyConfig } from '@/lib/hooks/useEndoscopyConfig';

interface EndoscopyFieldProps {
  field: FieldDefinition;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  error?: string;
}

/**
 * Composant réutilisable pour afficher un champ endoscopie
 */
export function EndoscopyField({
  field,
  value,
  onChange,
  disabled = false,
  error
}: EndoscopyFieldProps) {
  switch (field.type) {
    case 'textarea':
      return (
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">
            {field.label}
            {field.required && <span className="text-error ml-1">*</span>}
          </label>
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            className={`w-full bg-surface-container-lowest border-none rounded-lg px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 resize-none ${
              error ? 'ring-2 ring-error' : 'border border-outline-variant/15'
            }`}
            rows={4}
          />
          {error && <p className="text-xs text-error font-semibold">{error}</p>}
        </div>
      );

    case 'select':
      return (
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">
            {field.label}
            {field.required && <span className="text-error ml-1">*</span>}
          </label>
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={`w-full bg-surface-container-lowest border-none rounded-lg px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 ${
              error ? 'ring-2 ring-error' : 'border border-outline-variant/15'
            }`}
          >
            <option value="">-- Sélectionner --</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {error && <p className="text-xs text-error font-semibold">{error}</p>}
        </div>
      );

    case 'boolean':
      return (
        <div className="flex items-center gap-3 p-3 bg-surface-container-low/50 rounded-lg border border-outline-variant/10">
          <input
            type="checkbox"
            id={field.id}
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className="w-5 h-5 rounded cursor-pointer accent-primary"
          />
          <label htmlFor={field.id} className="text-sm font-semibold text-on-surface cursor-pointer flex-1">
            {field.label}
            {field.required && <span className="text-error ml-1">*</span>}
          </label>
        </div>
      );

    case 'checkbox':
      return (
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">
            {field.label}
            {field.required && <span className="text-error ml-1">*</span>}
          </label>
          <div className="flex flex-wrap gap-3">
            {field.options?.map(opt => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes(opt.value)}
                  onChange={(e) => {
                    const newValue = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      onChange([...newValue, opt.value]);
                    } else {
                      onChange(newValue.filter(v => v !== opt.value));
                    }
                  }}
                  disabled={disabled}
                  className="w-4 h-4 rounded cursor-pointer accent-primary"
                />
                <span className="text-sm font-medium text-on-surface">{opt.label}</span>
              </label>
            ))}
          </div>
          {error && <p className="text-xs text-error font-semibold">{error}</p>}
        </div>
      );

    case 'text':
    default:
      return (
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">
            {field.label}
            {field.required && <span className="text-error ml-1">*</span>}
          </label>
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            className={`w-full bg-surface-container-lowest border-none rounded-lg px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 ${
              error ? 'ring-2 ring-error' : 'border border-outline-variant/15'
            }`}
          />
          {error && <p className="text-xs text-error font-semibold">{error}</p>}
        </div>
      );
  }
}

/**
 * Composant pour afficher un groupe de champs
 */
interface EndoscopyFieldGroupProps {
  groupTitle: string;
  fields: FieldDefinition[];
  formData: Record<string, any>;
  errors: Record<string, string[]>;
  onChange: (fieldId: string, value: any) => void;
  disabled?: boolean;
}

export function EndoscopyFieldGroup({
  groupTitle,
  fields,
  formData,
  errors,
  onChange,
  disabled = false
}: EndoscopyFieldGroupProps) {
  if (fields.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-headline font-bold text-on-surface uppercase tracking-widest">
        {groupTitle}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-container-low/20 p-6 rounded-xl border border-outline-variant/10">
        {fields.map(field => (
          <div key={field.id} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
            <EndoscopyField
              field={field}
              value={formData[field.id]}
              onChange={(value) => onChange(field.id, value)}
              error={errors[field.id]?.[0]}
              disabled={disabled}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Composant pour afficher tous les champs d'un type d'endoscopie
 */
interface EndoscopyFormSectionProps {
  examType: string;
  formData: Record<string, any>;
  errors?: Record<string, string[]>;
  onChange: (fieldId: string, value: any) => void;
  disabled?: boolean;
  groups?: Record<string, string>;
}

export function EndoscopyFormSection({
  examType,
  formData,
  errors = {},
  onChange,
  disabled = false,
  groups = {}
}: EndoscopyFormSectionProps) {
  const { fieldsByGroup } = useEndoscopyConfig(examType);

  const defaultGroups: Record<string, string> = {
    'clinique': 'Informations Cliniques',
    'observations': 'Observations',
    'diagnostic': 'Diagnostic',
    'findings': 'Découvertes Spécifiques',
    'procedures': 'Procédures Effectuées',
    'complications': 'Complications',
    'followup': 'Suivi'
  };

  const groupLabels = { ...defaultGroups, ...groups };

  return (
    <div className="space-y-8">
      {Object.entries(fieldsByGroup).map(([groupKey, fields]: [string, any]) => {
        if (!fields || fields.length === 0) return null;
        
        return (
          <EndoscopyFieldGroup
            key={groupKey}
            groupTitle={groupLabels[groupKey] || groupKey}
            fields={fields}
            formData={formData}
            errors={errors}
            onChange={onChange}
            disabled={disabled}
          />
        );
      })}
    </div>
  );
}
