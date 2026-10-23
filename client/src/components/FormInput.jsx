import React, { useState, useEffect } from 'react';
import { validateField, sanitizeInput } from '../utils/validation';

/**
 * Enhanced form input component with built-in validation and sanitization
 */
const FormInput = ({
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  label,
  required = false,
  validationRules = {},
  className = '',
  disabled = false,
  autoComplete = 'off',
  helpText,
  ...props
}) => {
  const [errors, setErrors] = useState([]);
  const [touched, setTouched] = useState(false);
  const [sanitizedValue, setSanitizedValue] = useState(value || '');

  useEffect(() => {
    setSanitizedValue(value || '');
  }, [value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    const sanitized = sanitizeInput(newValue, validationRules.allowHtml);
    
    setSanitizedValue(sanitized);
    
    if (onChange) {
      onChange({
        ...e,
        target: {
          ...e.target,
          name,
          value: sanitized
        }
      });
    }

    // Validate on change if field has been touched
    if (touched) {
      validateInput(sanitized);
    }
  };

  const handleBlur = (e) => {
    setTouched(true);
    validateInput(sanitizedValue);
    
    if (onBlur) {
      onBlur(e);
    }
  };

  const validateInput = (inputValue) => {
    const validation = validateField(name, inputValue, {
      required,
      ...validationRules
    });
    
    setErrors(validation.errors);
    return validation.isValid;
  };

  const hasErrors = errors.length > 0 && touched;
  const inputClasses = `
    w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors
    ${hasErrors 
      ? 'border-error focus:ring-error focus:border-error' 
      : 'border-gray-300 focus:ring-primary focus:border-primary'
    }
    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
    ${className}
  `.trim();

  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-secondary mb-1">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          id={name}
          name={name}
          type={type}
          value={sanitizedValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={inputClasses}
          disabled={disabled}
          autoComplete={autoComplete}
          {...props}
        />
        
        {hasErrors && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-error" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      
      {hasErrors && (
        <div className="mt-1">
          {errors.map((error, index) => (
            <p key={index} className="text-sm text-error">
              {error}
            </p>
          ))}
        </div>
      )}
      
      {helpText && !hasErrors && (
        <p className="mt-1 text-sm text-muted">
          {helpText}
        </p>
      )}
    </div>
  );
};

export default FormInput;
