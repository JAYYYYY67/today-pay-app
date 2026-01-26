import { type SelectHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
    placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, label, error, options, placeholder, id, ...props }, ref) => {
        const selectId = id || props.name;

        return (
            <div className="flex flex-col gap-1.5 w-full">
                {label && (
                    <label htmlFor={selectId} className="text-sm font-semibold text-gray-700 ml-1">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <select
                        id={selectId}
                        ref={ref}
                        className={cn(
                            'w-full px-4 py-3.5 pr-10 rounded-2xl bg-gray-50 border border-transparent font-medium text-gray-900 appearance-none',
                            'focus:bg-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all',
                            'disabled:opacity-60 disabled:bg-gray-100',
                            error && 'border-error focus:border-error focus:ring-error bg-red-50',
                            className
                        )}
                        {...props}
                    >
                        {placeholder && (
                            <option value="" disabled selected hidden>
                                {placeholder}
                            </option>
                        )}
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
                {error && <p className="text-xs text-error font-medium ml-1">{error}</p>}
            </div>
        );
    }
);

Select.displayName = 'Select';

export default Select;
