import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'outline' | 'ghost' | 'link';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', ...props }, ref) => {
        const variantStyles = {
            default: 'border border-white bg-[#0a0a0a] text-white hover:bg-[#1a1a1a]',
            outline: 'border border-white/20 bg-transparent text-white hover:bg-white/5',
            ghost: 'border-none bg-transparent text-white hover:bg-white/5',
            link: 'border-none bg-transparent text-blue-500 hover:underline px-0 h-auto'
        }

        return (
            <button
                ref={ref}
                className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-400 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 ${variantStyles[variant]} ${className}`}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={`flex h-10 w-full rounded-md border border-white bg-[#0a0a0a] px-3 py-1 text-sm text-white shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
                ref={ref}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"

export const Card = ({
    children,
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={`rounded-xl border border-white bg-[#0a0a0a] text-white shadow ${className}`}
        {...props}
    >
        {children}
    </div>
)
