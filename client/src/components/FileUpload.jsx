import React, { useState, useRef } from 'react';
import { validateFile } from '../utils/validation';

/**
 * Secure file upload component with validation
 */
const FileUpload = ({
  name,
  onChange,
  label,
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB default
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  required = false,
  multiple = false,
  className = '',
  disabled = false,
  preview = true,
  ...props
}) => {
  const [errors, setErrors] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const fileInputRef = useRef(null);

  const validateFiles = (files) => {
    const fileArray = Array.from(files);
    const validationResults = fileArray.map(file => 
      validateFile(file, { allowedTypes, maxSize, required })
    );

    const allErrors = validationResults.flatMap(result => result.errors);
    setErrors(allErrors);

    return allErrors.length === 0;
  };

  const generatePreviews = (files) => {
    if (!preview) return;

    const fileArray = Array.from(files);
    const newPreviews = [];

    fileArray.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          newPreviews.push({
            name: file.name,
            url: e.target.result,
            type: 'image'
          });
          if (newPreviews.length === fileArray.length) {
            setPreviews(newPreviews);
          }
        };
        reader.readAsDataURL(file);
      } else {
        newPreviews.push({
          name: file.name,
          type: 'file'
        });
      }
    });

    if (fileArray.every(file => !file.type.startsWith('image/'))) {
      setPreviews(newPreviews);
    }
  };

  const handleFileChange = (files) => {
    if (!files || files.length === 0) return;

    const isValid = validateFiles(files);
    
    if (isValid) {
      setSelectedFiles(Array.from(files));
      generatePreviews(files);
      
      if (onChange) {
        onChange({
          target: {
            name,
            files: multiple ? files : files[0]
          }
        });
      }
    }
  };

  const handleInputChange = (e) => {
    handleFileChange(e.target.files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    handleFileChange(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
    
    if (onChange) {
      onChange({
        target: {
          name,
          files: multiple ? newFiles : (newFiles[0] || null)
        }
      });
    }
  };

  const hasErrors = errors.length > 0;
  const dropzoneClasses = `
    border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
    ${dragOver 
      ? 'border-blue-400 bg-blue-50' 
      : hasErrors 
        ? 'border-red-300 bg-red-50' 
        : 'border-gray-300 hover:border-gray-400'
    }
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `.trim();

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div
        className={dropzoneClasses}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          name={name}
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
          {...props}
        />

        <div className="space-y-2">
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          
          <div className="text-sm text-gray-600">
            <span className="font-medium text-blue-600 hover:text-blue-500">
              Click to upload
            </span>
            {' '}or drag and drop
          </div>
          
          <p className="text-xs text-gray-500">
            {allowedTypes.join(', ')} up to {(maxSize / (1024 * 1024)).toFixed(1)}MB
          </p>
        </div>
      </div>

      {/* File Previews */}
      {previews.length > 0 && (
        <div className="mt-4 space-y-2">
          {previews.map((preview, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
              <div className="flex items-center space-x-3">
                {preview.type === 'image' ? (
                  <img 
                    src={preview.url} 
                    alt={preview.name}
                    className="h-10 w-10 object-cover rounded"
                  />
                ) : (
                  <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                    <svg className="h-6 w-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <span className="text-sm text-gray-700 truncate">{preview.name}</span>
              </div>
              
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Error Messages */}
      {hasErrors && (
        <div className="mt-2">
          {errors.map((error, index) => (
            <p key={index} className="text-sm text-red-600">
              {error}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
