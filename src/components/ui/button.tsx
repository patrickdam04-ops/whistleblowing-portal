import * as React from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  asChild?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  default: 'bg-slate-700 text-slate-100 hover:bg-slate-600',
  destructive: 'bg-red-600 text-white hover:bg-red-700',
  outline: 'border border-slate-500 bg-slate-800/80 text-slate-200 hover:bg-slate-700',
  secondary: 'bg-slate-700 text-slate-200 hover:bg-slate-600',
  ghost: 'text-slate-300 hover:bg-slate-800 hover:text-slate-100',
  link: 'text-slate-400 underline-offset-4 hover:text-slate-200 hover:underline',
}

const sizeStyles: Record<ButtonSize, string> = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 rounded-xl px-3',
  lg: 'h-11 rounded-xl px-8',
  icon: 'h-10 w-10 rounded-xl',
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'
    
    const combinedClassName = cn(baseStyles, variantStyles[variant], sizeStyles[size], className)
    
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        className: cn(children.props.className, combinedClassName),
        ...props,
      })
    }

    return (
      <button
        className={combinedClassName}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button }
