import { useState, useRef, useEffect } from 'react';
import { useBusiness } from '../../contexts/BusinessContext';
import { ChevronDown, Plus, Building2, Check } from 'lucide-react';
import { cn } from '../../utils/cn';

export default function BusinessSwitcher() {
    const { businesses, currentBusiness, switchBusiness, addBusiness } = useBusiness();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAddBusiness = () => {
        const name = prompt('새로운 사업장(지점) 이름을 입력하세요 (예: 2호점)');
        if (name && name.trim()) {
            addBusiness(name.trim());
            setIsOpen(false);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-2 py-1.5 -ml-2 rounded-xl text-gray-800 hover:bg-gray-100/80 transition-all group"
            >
                <span className="text-xl font-black text-primary tracking-tight">
                    {currentBusiness?.name || 'TodayPay'}
                </span>
                <ChevronDown className={cn(
                    "w-4 h-4 text-gray-400 transition-transform duration-200 group-hover:text-primary",
                    isOpen && "rotate-180 text-primary"
                )} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-[200px] bg-white rounded-2xl shadow-float border border-gray-100 overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2 space-y-1">
                        <div className="px-3 py-2 text-xs font-bold text-gray-400">
                            내 사업장
                        </div>
                        {businesses.map((business) => (
                            <button
                                key={business.id}
                                onClick={() => {
                                    switchBusiness(business.id);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors",
                                    currentBusiness?.id === business.id
                                        ? "bg-teal-50 text-primary font-bold"
                                        : "text-gray-600 hover:bg-gray-50"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <Building2 className={cn(
                                        "w-4 h-4",
                                        currentBusiness?.id === business.id ? "text-primary" : "text-gray-400"
                                    )} />
                                    <span className="truncate max-w-[120px]">{business.name}</span>
                                </div>
                                {currentBusiness?.id === business.id && (
                                    <Check className="w-3.5 h-3.5 text-primary" />
                                )}
                            </button>
                        ))}

                        <div className="h-px bg-gray-100 my-1 mx-2" />

                        <button
                            onClick={handleAddBusiness}
                            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-primary hover:bg-teal-50 transition-colors"
                        >
                            <div className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center border-dashed group-hover:border-primary">
                                <Plus className="w-3 h-3" />
                            </div>
                            <span className="font-medium">새 사업장 추가</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
