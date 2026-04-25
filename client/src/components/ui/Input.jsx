import React, { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  id,
  type = 'text',
  error,
  helperText,
  icon,
  className = '',
  fullWidth = true,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const widthClass = fullWidth ? 'w-full' : '';
  
  return (
    <div className={`flex flex-col mb-4 ${widthClass} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="mb-1 text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={`
            block w-full rounded-lg border text-gray-900 
            focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors py-2.5
            ${icon ? 'pl-10' : 'pl-3'}
            ${error 
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
              : 'border-gray-300 hover:border-gray-400'
            }
          `}
          {...props}
        />
      </div>
      
      {(error || helperText) && (
        <p className={`mt-1.5 text-xs ${error ? 'text-red-600' : 'text-gray-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
