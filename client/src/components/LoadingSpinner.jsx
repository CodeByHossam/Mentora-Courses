import React, { memo } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Reusable loading spinner component with consistent styling
 */
const LoadingSpinner = memo(({
  size = 'md',
  color = 'primary',
  className = '',
  text,
  fullScreen = false
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };
  
  const colorClasses = {
    primary: 'text-primary-500',
    secondary: 'text-secondary-500',
    gray: 'text-gray-500',
    white: 'text-white'
  };
  
  const spinnerClasses = [
    'animate-spin',
    sizeClasses[size],
    colorClasses[color],
    className
  ].filter(Boolean).join(' ');
  
  const content = (
    <div className="flex flex-col items-center justify-center space-y-2">
      <Loader2 className={spinnerClasses} />
      {text && (
        <p className="text-sm text-gray-600 animate-pulse">{text}</p>
      )}
    </div>
  );
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        {content}
      </div>
    );
  }
  
  return content;
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;
