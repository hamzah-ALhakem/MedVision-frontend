import React from 'react';
import { AlertCircle } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export default function Input({ label, error, icon: Icon, className, ...props }) {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="block text-sm font-bold text-gray-700 mx-1">
          {label}
        </label>
      )}
      
      <div className="relative group">
        {/* Icon (Start Position) - يتغير تلقائياً مع اللغة */}
        {Icon && (
          <div className={`absolute top-1/2 -translate-y-1/2 start-4 pointer-events-none transition-colors duration-300
            ${error ? 'text-red-400' : 'text-gray-400 group-focus-within:text-primary'}`}>
            <Icon size={20} />
          </div>
        )}
        
        <input
          className={twMerge(`
            w-full bg-white border-2 rounded-xl py-3.5 px-4 outline-none transition-all duration-300 font-medium text-dark placeholder:text-gray-400
            ${Icon ? 'ps-12' : ''} 
            ${error 
              ? 'border-red-300 bg-red-50/10 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
              : 'border-gray-100 focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-gray-200'
            }
          `, className)}
          {...props}
        />

        {/* Error Icon (End Position) */}
        {error && (
          <div className="absolute top-1/2 -translate-y-1/2 end-4 text-red-500 pointer-events-none animate-in fade-in zoom-in">
            <AlertCircle size={20} />
          </div>
        )}
      </div>
      
      {/* Error Message */}
      {error && (
        <p className="text-xs font-bold text-red-500 mx-1 animate-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
}