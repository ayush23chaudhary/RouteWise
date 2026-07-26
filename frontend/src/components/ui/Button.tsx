import { forwardRef } from 'react'
import { clsx } from 'clsx'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const variantStyles: Record<Variant, string> = {
  primary:   'bg-[--color-accent] text-white hover:bg-[--color-accent-hover] shadow-[--shadow-sm]',
  secondary: 'bg-[--color-bg-elevated] text-[--color-text-primary] border border-[--color-border] hover:bg-[--color-bg-hover] hover:border-[--color-border-focus]',
  ghost:     'bg-transparent text-[--color-text-secondary] hover:bg-[--color-bg-hover] hover:text-[--color-text-primary]',
  danger:    'bg-[--color-violation]/15 text-[--color-violation] border border-[--color-violation]/30 hover:bg-[--color-violation]/25',
  success:   'bg-[--color-compliant]/15 text-[--color-compliant] border border-[--color-compliant]/30 hover:bg-[--color-compliant]/25',
}

const sizeStyles: Record<Size, string> = {
  sm: 'h-7  px-3   text-xs  gap-1.5',
  md: 'h-8  px-3.5 text-sm  gap-2',
  lg: 'h-10 px-5   text-sm  gap-2.5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          'inline-flex items-center justify-center font-medium rounded-[--radius-md] transition-all duration-[--transition-fast] select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus] focus-visible:ring-offset-1 focus-visible:ring-offset-[--color-bg-base] disabled:opacity-40 disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? <Loader2 size={14} className="animate-spin" /> : leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    )
  }
)
Button.displayName = 'Button'
