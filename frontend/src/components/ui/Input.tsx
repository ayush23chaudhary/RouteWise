import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftSlot?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftSlot, className, id, style, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    const baseInputStyle: React.CSSProperties = {
      width: '100%',
      height: '36px',
      background: 'var(--rw-bg-surface)',
      border: `1px solid ${error ? 'var(--rw-violation)' : 'var(--rw-border-medium)'}`,
      borderRadius: 'var(--rw-radius-lg)',
      fontSize: '13px',
      fontWeight: 500,
      color: 'var(--rw-text-primary)',
      padding: leftSlot ? '0 12px 0 36px' : '0 12px',
      fontFamily: 'var(--rw-font-sans)',
      outline: 'none',
      transition: 'border-color var(--rw-t-fast), box-shadow var(--rw-t-fast)',
      boxSizing: 'border-box',
      ...style,
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {label && (
          <label
            htmlFor={inputId}
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: 'var(--rw-text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
            }}
          >
            {label}
          </label>
        )}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {leftSlot && (
            <span
              style={{
                position: 'absolute',
                left: 10,
                color: 'var(--rw-text-tertiary)',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
              }}
            >
              {leftSlot}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            style={baseInputStyle}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            onFocus={e => {
              e.currentTarget.style.borderColor = error ? 'var(--rw-violation)' : 'var(--rw-border-focus)'
              e.currentTarget.style.boxShadow = error
                ? '0 0 0 3px rgba(239,68,68,0.12)'
                : '0 0 0 3px rgba(59,130,246,0.12)'
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = error ? 'var(--rw-violation)' : 'var(--rw-border-medium)'
              e.currentTarget.style.boxShadow = 'none'
            }}
            className={className}
            {...props}
          />
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            role="alert"
            style={{ fontSize: '11px', color: 'var(--rw-violation)', fontWeight: 500 }}
          >
            {error}
          </p>
        )}
        {hint && !error && (
          <p
            id={`${inputId}-hint`}
            style={{ fontSize: '11px', color: 'var(--rw-text-tertiary)' }}
          >
            {hint}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'
