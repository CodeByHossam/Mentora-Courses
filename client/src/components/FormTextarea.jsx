import React, { useState, useEffect } from 'react';
import { validateField, sanitizeInput } from '../utils/validation';

/**
 * Enhanced textarea component with validation and sanitization
 */
const FormTextarea = ({
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  label,
  required = false,
  validationRules = {},
  className = '',
  disabled = false,
  rows = 4,
  maxLength,
  ...props
}) => {
  const [errors, setErrors] = useState([]);
  const [touched, setTouched] = useState(false);
  const [sanitizedValue, setSanitizedValue] = useState(value || '');
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    setSanitizedValue(value || '');
    setCharCount((value || '').length);
  }, [value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    const sanitized = sanitizeInput(newValue, validationRules.allowHtml);
    
    setSanitizedValue(sanitized);
    setCharCount(sanitized.length);
    
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
  const textareaClasses = `
    w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors resize-vertical
    ${hasErrors 
      ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
    }
    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
    ${className}
  `.trim();

  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <textarea
          id={name}
          name={name}
          value={sanitizedValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={textareaClasses}
          disabled={disabled}
          rows={rows}
          maxLength={maxLength}
          {...props}
        />
      </div>
      
      <div className="flex justify-between items-start mt-1">
        <div className="flex-1">
          {hasErrors && (
            <div>
              {errors.map((error, index) => (
                <p key={index} className="text-sm text-red-600">
                  {error}
                </p>
              ))}
            </div>
          )}
        </div>
        
        {maxLength && (
          <div className={`text-xs ml-2 ${charCount > maxLength * 0.9 ? 'text-red-500' : 'text-gray-500'}`}>
            {charCount}/{maxLength}
          </div>
        )}
      </div>
    </div>
  );
};

export default FormTextarea;
