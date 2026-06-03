import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-3 py-2 rounded-lg border text-gray-900 dark:text-dark-text placeholder-gray-400 dark:placeholder-dark-muted
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors
            ${error
              ? 'border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-600'
              : 'border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface'
            }
            ${className}
          `}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="mt-1 text-sm text-gray-500 dark:text-dark-muted">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';