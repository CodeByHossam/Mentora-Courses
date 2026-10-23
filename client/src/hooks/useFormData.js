import React, { useState, useCallback, useRef } from 'react';
import { validateField, sanitizeInput } from '../utils/validation';

/**
 * Custom hook for consistent form data handling across the application
 * Provides validation, sanitization, error handling, and loading states
 */
export const useFormData = (initialData = {}, validationSchema = {}) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  // Initialize with validation to set proper error format
  React.useEffect(() => {
    const initialErrors = {};
    Object.keys(validationSchema).forEach(fieldName => {
      const validation = validateField(fieldName, formData[fieldName], validationSchema[fieldName], formData);
      initialErrors[fieldName] = validation.isValid ? '' : validation.errors.join(', ');
    });
    setErrors(initialErrors);
  }, []); // Only run once on mount
  
  // Keep track of original data for dirty checking
  const originalData = useRef(initialData);

  // Update a single field with validation and sanitization
  const updateField = useCallback((name, value, shouldValidate = true) => {
    // Sanitize the input
    const sanitizedValue = typeof value === 'string' ? sanitizeInput(value) : value;
    
    setFormData(prev => {
      const newData = { ...prev, [name]: sanitizedValue };
      
      // Check if form is dirty
      const isDirtyNow = JSON.stringify(newData) !== JSON.stringify(originalData.current);
      setIsDirty(isDirtyNow);
      
      // Validate field if schema exists and validation is enabled
      if (shouldValidate && validationSchema[name]) {
        const validation = validateField(name, sanitizedValue, validationSchema[name], newData);
        setErrors(prevErrors => ({
          ...prevErrors,
          [name]: validation.isValid ? '' : validation.errors.join(', ')
        }));
      }
      
      return newData;
    });

    // Mark field as touched
    setTouched(prev => ({ ...prev, [name]: true }));
  }, [validationSchema]);

  // Update multiple fields at once
  const updateFields = useCallback((updates) => {
    const sanitizedUpdates = {};
    const newErrors = { ...errors };

    Object.entries(updates).forEach(([name, value]) => {
      // Sanitize each value
      sanitizedUpdates[name] = typeof value === 'string' ? sanitizeInput(value) : value;
      
      // Validate if schema exists
      if (validationSchema[name]) {
        const validation = validateField(name, sanitizedUpdates[name], validationSchema[name], { ...formData, ...sanitizedUpdates });
        newErrors[name] = validation.isValid ? '' : validation.errors.join(', ');
      }
    });

    setFormData(prev => {
      const newData = { ...prev, ...sanitizedUpdates };
      const isDirtyNow = JSON.stringify(newData) !== JSON.stringify(originalData.current);
      setIsDirty(isDirtyNow);
      return newData;
    });

    setErrors(newErrors);
    
    // Mark all updated fields as touched
    setTouched(prev => ({
      ...prev,
      ...Object.keys(updates).reduce((acc, key) => ({ ...acc, [key]: true }), {})
    }));
  }, [errors, validationSchema]);

  // Reset form to initial state
  const resetForm = useCallback((newInitialData = null) => {
    const dataToReset = newInitialData || originalData.current;
    setFormData(dataToReset);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setIsDirty(false);
    if (newInitialData) {
      originalData.current = newInitialData;
    }
  }, []);

  // Validate entire form
  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.entries(validationSchema).forEach(([fieldName, rules]) => {
      const validation = validateField(fieldName, formData[fieldName], rules, formData);
      if (!validation.isValid) {
        newErrors[fieldName] = validation.errors.join(', ');
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [formData, validationSchema]);

  // Handle form submission with validation
  const handleSubmit = useCallback(async (submitCallback, options = {}) => {
    const { skipValidation = false, onSuccess, onError } = options;
    
    setIsSubmitting(true);
    
    try {
      // Validate form unless skipped
      if (!skipValidation) {
        const isValid = validateForm();
        if (!isValid) {
          setIsSubmitting(false);
          return { success: false, errors };
        }
      }

      // Call the submit callback
      const result = await submitCallback(formData);
      
      // Handle success
      if (onSuccess) {
        await onSuccess(result);
      }
      
      setIsSubmitting(false);
      return { success: true, data: result };
      
    } catch (error) {
      setIsSubmitting(false);
      
      // Handle API validation errors
      if (error?.data?.errors) {
        setErrors(error.data.errors);
      }
      
      if (onError) {
        await onError(error);
      }
      
      return { success: false, error };
    }
  }, [validateForm, errors, formData]);

  // Get field props for easy integration with form components
  const getFieldProps = useCallback((name, options = {}) => {
    const { type = 'text', transform } = options;
    
    // Convert error to string format
    const getErrorString = (error) => {
      if (!error) return '';
      if (typeof error === 'string') return error;
      if (typeof error === 'object' && error.errors) {
        return error.isValid ? '' : error.errors.join(', ');
      }
      return '';
    };
    
    return {
      name,
      value: formData[name] || '',
      error: touched[name] ? getErrorString(errors[name]) : '',
      onChange: (e) => {
        let value = e.target ? e.target.value : e;
        if (transform) {
          value = transform(value);
        }
        updateField(name, value);
      },
      onBlur: () => setTouched(prev => ({ ...prev, [name]: true })),
      type,
      required: validationSchema[name]?.required || false
    };
  }, [formData, errors, touched, validationSchema, updateField]);

  // Get file field props
  const getFileFieldProps = useCallback((name, options = {}) => {
    const { multiple = false, accept } = options;
    
    // Convert error to string format
    const getErrorString = (error) => {
      if (!error) return '';
      if (typeof error === 'string') return error;
      if (typeof error === 'object' && error.errors) {
        return error.isValid ? '' : error.errors.join(', ');
      }
      return '';
    };
    
    return {
      name,
      error: touched[name] ? getErrorString(errors[name]) : '',
      onChange: (files) => {
        updateField(name, multiple ? files : files[0]);
      },
      onBlur: () => setTouched(prev => ({ ...prev, [name]: true })),
      multiple,
      accept,
      required: validationSchema[name]?.required || false
    };
  }, [errors, touched, validationSchema, updateField]);

  // Check if form has errors
  const hasErrors = Object.values(errors).some(error => {
    if (typeof error === 'string') {
      return error !== '';
    }
    if (typeof error === 'object' && error !== null) {
      return !error.isValid;
    }
    return !!error;
  });

  // Check if form is valid (no errors and all required fields filled)
  const isValid = !hasErrors && Object.entries(validationSchema).every(([fieldName, rules]) => {
    if (rules.required) {
      const value = formData[fieldName];
      return value !== undefined && value !== null && value !== '';
    }
    return true;
  });

  return {
    // Data
    formData,
    errors,
    touched,
    
    // State
    isSubmitting,
    isDirty,
    hasErrors,
    isValid,
    
    // Actions
    updateField,
    updateFields,
    resetForm,
    validateForm,
    handleSubmit,
    
    // Helpers
    getFieldProps,
    getFileFieldProps,
    
    // Utilities
    setIsSubmitting,
    setErrors,
    setTouched
  };
};

export default useFormData;
