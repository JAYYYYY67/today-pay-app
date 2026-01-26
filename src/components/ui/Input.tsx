import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, id, ...props }, ref) => {
        const inputId = id || props.name;

        return (
            <div className="flex flex-col gap-1.5 w-full">
                {label && (
                    <label htmlFor={inputId} className="text-sm font-semibold text-gray-700 ml-1">
                        {label}
                    </label>
                )}
                <input
                    id={inputId}
                    ref={ref}
                    className={cn(
                        'w-full px-4 py-3.5 rounded-2xl bg-gray-50 border border-transparent font-medium text-gray-900 placeholder:text-gray-500',
                        'focus:bg-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all',
                        'disabled:opacity-60 disabled:bg-gray-100',
                        error && 'border-error focus:border-error focus:ring-error bg-red-50',
                        className
                    )}
                    {...props}
                />
                {error && <p className="text-xs text-error font-medium ml-1">{error}</p>}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
