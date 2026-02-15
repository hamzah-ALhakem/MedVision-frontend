import React from 'react';
import { Loader2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export default function Button({ 
  children, 
  isLoading, 
  variant = 'primary', 
  className = '', 
  disabled, 
  type = 'button',
  ...props 
}) {
  const baseStyles = "w-full py-3.5 px-6 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100";

  const variants = {
    primary: "bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-hover hover:shadow-xl border border-transparent",
    secondary: "bg-secondary text-primary hover:bg-primary/10 border border-transparent",
    outline: "bg-transparent border-2 border-primary/20 text-primary hover:border-primary hover:bg-primary/5",
    ghost: "bg-transparent text-primary hover:bg-gray-100",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-transparent"
  };

  return (
    <button 
      type={type}
      className={twMerge(baseStyles, variants[variant], className)} 
      disabled={isLoading || disabled} 
      {...props}
    >
      {isLoading ? <Loader2 className="animate-spin" size={20} /> : children}
    </button>
  );
}