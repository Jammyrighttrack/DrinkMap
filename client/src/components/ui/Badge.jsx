import React from 'react';

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  icon = null,
  pill = true,
  ...props
}) => {
  // Base classes
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors shadow-sm';
  const radiusClass = pill ? 'rounded-full' : 'rounded-md';
  
  // Size variations
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };
  
  // Style variations (Màu sắc)
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200',
    primary: 'bg-orange-100 text-orange-800 border border-orange-200 hover:bg-orange-200',
    solid: 'bg-orange-600 text-white hover:bg-orange-700',
    success: 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200',
    danger: 'bg-rose-100 text-rose-800 border border-rose-200 hover:bg-rose-200',
    match: 'bg-gradient-to-r from-orange-500 to-amber-400 text-white border-none shadow-md', // Dành riêng cho Điểm Match AI
  };

  return (
    <span
      className={`${baseClasses} ${radiusClass} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </span>
  );
};

export default Badge;
