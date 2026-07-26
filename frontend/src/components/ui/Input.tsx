import { forwardRef } from 'react'
import { clsx } from 'clsx'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftSlot?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftSlot, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-[--color-text-secondary] uppercase tracking-wide"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftSlot && (
            <span className="absolute left-3 text-[--color-text-tertiary] flex items-center pointer-events-none">
              {leftSlot}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              'w-full h-9 bg-[--color-bg-elevated] border rounded-[--radius-md] text-sm text-[--color-text-primary] placeholder:text-[--color-text-disabled] transition-colors duration-[--transition-fast]',
              'focus:outline-none focus:border-[--color-border-focus] focus:ring-1 focus:ring-[--color-border-focus]/30',
              error ? 'border-[--color-violation]' : 'border-[--color-border]',
              leftSlot ? 'pl-9 pr-3' : 'px-3',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-[--color-violation]" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-[--color-text-tertiary]">
            {hint}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'
