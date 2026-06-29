import { useMemo, useState } from 'react';
import { 
  getEndoscopyConfig, 
  getAllFields, 
  getFieldsByGroup,
  EndoscopyTypeConfig,
  FieldDefinition 
} from '@/lib/config/endoscopyTypes';

/**
 * Hook pour gérer la configuration dynamique d'un type d'endoscopie
 */
export function useEndoscopyConfig(examType?: string) {
  const config = useMemo(() => {
    if (!examType) return null;
    return getEndoscopyConfig(examType);
  }, [examType]);

  const allFields = useMemo(() => {
    if (!examType) return [];
    return getAllFields(examType);
  }, [examType]);

  const commonFields = useMemo(() => {
    if (!config) return [];
    return config.commonFields;
  }, [config]);

  const specificFields = useMemo(() => {
    if (!config) return [];
    return config.specificFields;
  }, [config]);

  const fieldsByGroup = useMemo(() => {
    if (!examType) return {};
    const groups = ['clinique', 'observations', 'diagnostic', 'findings', 'procedures', 'complications', 'followup'];
    const result: Record<string, FieldDefinition[]> = {};
    
    groups.forEach(group => {
      result[group] = getFieldsByGroup(examType, group);
    });
    
    return result;
  }, [examType]);

  return {
    config,
    allFields,
    commonFields,
    specificFields,
    fieldsByGroup
  };
}

/**
 * Hook pour valider les données selon la configuration
 */
export function useEndoscopyFormValidation(examType?: string) {
  const { allFields } = useEndoscopyConfig(examType);

  const validateField = (fieldId: string, value: any): string[] => {
    const field = allFields.find(f => f.id === fieldId);
    if (!field) return [];

    const errors: string[] = [];

    if (field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      errors.push(`${field.label} est requis`);
    }

    return errors;
  };

  const validateForm = (formData: Record<string, any>): Record<string, string[]> => {
    const errors: Record<string, string[]> = {};

    allFields.forEach(field => {
      const fieldErrors = validateField(field.id, formData[field.id]);
      if (fieldErrors.length > 0) {
        errors[field.id] = fieldErrors;
      }
    });

    return errors;
  };

  return {
    validateField,
    validateForm,
    hasErrors: (errors: Record<string, string[]>) => Object.keys(errors).length > 0
  };
}

/**
 * Hook pour gérer l'état du formulaire endoscopie
 */
export function useEndoscopyForm(initialData?: Record<string, any>) {
  const [formData, setFormData] = useState<Record<string, any>>(
    initialData || {}
  );

  const updateField = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const updateMultipleFields = (updates: Record<string, any>) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  };

  const resetForm = (data?: Record<string, any>) => {
    setFormData(data || {});
  };

  const getFieldValue = (fieldId: string): any => {
    return formData[fieldId];
  };

  return {
    formData,
    updateField,
    updateMultipleFields,
    resetForm,
    getFieldValue
  };
}
