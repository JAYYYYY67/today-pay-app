import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost';
    fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', fullWidth, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    'flex items-center justify-center gap-2 font-bold py-3.5 px-6 rounded-2xl transition-all active:scale-[0.98] text-base',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    {
                        'bg-primary text-white hover:bg-primary-hover': variant === 'primary',
                        'bg-gray-100 text-gray-700 hover:bg-gray-200': variant === 'secondary',
                        'bg-transparent text-gray-600 hover:bg-gray-50': variant === 'ghost',
                        'w-full': fullWidth,
                    },
                    className
                )}
                {...props}
            >
                {props.children}
            </button>
        );
    }
);

Button.displayName = 'Button';

export default Button;
