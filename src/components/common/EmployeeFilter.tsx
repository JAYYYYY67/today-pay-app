import { useState, useEffect, useRef } from 'react';
import { type Employee } from '../../types';
import { cn } from '../../utils/cn';
import { ChevronDown, Check, Square, CheckSquare } from 'lucide-react';

export type FilterMode = 'ALL' | 'ACTIVE' | 'RETIRED';

interface EmployeeFilterProps {
    employees: Employee[];
    selectedIds: string[];
    onSelect: (ids: string[]) => void;
    mode: FilterMode;
    onModeChange: (mode: FilterMode) => void;
}

export default function EmployeeFilter({ employees, selectedIds, onSelect, mode, onModeChange }: EmployeeFilterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [tempSelectedIds, setTempSelectedIds] = useState<string[]>([]); // 드롭다운 내부용 임시 상태
    const dropdownRef = useRef<HTMLDivElement>(null);

    // 드롭다운 열릴 때 부모 상태와 동기화
    useEffect(() => {
        if (isOpen) {
            setTempSelectedIds(selectedIds);
        }
    }, [isOpen, selectedIds]);

    // 탭 변경 핸들러
    const handleTabChange = (newMode: FilterMode) => {
        if (newMode === 'ALL') {
            // 전체 탭으로 가면 선택 해제 (전체 보기)
            onSelect([]);
        } else {
            // 탭 변경 시 선택 초기화
            onSelect([]);
        }
        onModeChange(newMode);
        setIsOpen(false);
    };

    // 필터링된 직원 목록 (현재 모드에 따름) + 가나다 정렬
    const currentEmployees = employees
        .filter(emp => {
            if (mode === 'ACTIVE') return !emp.isRetired;
            if (mode === 'RETIRED') return emp.isRetired;
            return true;
        })
        .sort((a, b) => a.name.localeCompare(b.name));

    // [Case A] 체크박스 클릭: 다중 선택 토글 (드롭다운 유지)
    const handleCheckboxClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // 행 클릭 이벤트 전파 방지

        setTempSelectedIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(pid => pid !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    // [Case B] 행(이름) 클릭: 단일 선택 및 즉시 적용 (드롭다운 닫기)
    const handleRowClick = (id: string) => {
        onSelect([id]);
        setIsOpen(false);
    };

    // [적용] 버튼 클릭: 다중 선택 적용 (드롭다운 닫기)
    const handleApply = () => {
        onSelect(tempSelectedIds);
        setIsOpen(false);
    };

    // 외부 클릭 시 드롭다운 닫기 (취소 처리)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getDropdownLabel = () => {
        if (selectedIds.length === 0) return '직원 선택 (전체)';
        if (selectedIds.length === 1) {
            const emp = employees.find(e => e.id === selectedIds[0]);
            return emp ? emp.name : '직원 선택';
        }
        return `${selectedIds.length}명 선택됨`;
    };

    return (
        <div className="px-6 pb-2">
            {/* Top Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-xl mb-3 w-fit">
                <button
                    onClick={() => handleTabChange('ALL')}
                    className={cn(
                        "px-4 py-1.5 rounded-lg text-sm font-bold transition-all",
                        mode === 'ALL' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    )}
                >
                    전체
                </button>
                <button
                    onClick={() => handleTabChange('ACTIVE')}
                    className={cn(
                        "px-4 py-1.5 rounded-lg text-sm font-bold transition-all",
                        mode === 'ACTIVE' ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
                    )}
                >
                    재직
                </button>
                <button
                    onClick={() => handleTabChange('RETIRED')}
                    className={cn(
                        "px-4 py-1.5 rounded-lg text-sm font-bold transition-all",
                        mode === 'RETIRED' ? "bg-white text-gray-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    )}
                >
                    퇴사
                </button>
            </div>

            {/* Dropdown for Active/Retired modes */}
            {mode !== 'ALL' && (
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className={cn(
                            "w-full flex items-center justify-between px-4 py-3 bg-white border rounded-xl text-left transition-all active:scale-[0.99]",
                            isOpen ? "border-primary ring-2 ring-teal-50" : "border-gray-200 hover:border-gray-300",
                            selectedIds.length > 0 ? "text-primary font-bold bg-teal-50/50" : "text-gray-500"
                        )}
                    >
                        <span className="text-sm">{getDropdownLabel()}</span>
                        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
                    </button>

                    {isOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-[100] max-h-[350px] flex flex-col animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                            {/* Scrollable List Area */}
                            <div className="overflow-y-auto p-2 custom-scrollbar flex-1">
                                {currentEmployees.length === 0 ? (
                                    <div className="p-4 text-center text-gray-400 text-sm">해당하는 직원이 없습니다.</div>
                                ) : (
                                    <div className="space-y-1">
                                        {currentEmployees.map(emp => {
                                            const isChecked = tempSelectedIds.includes(emp.id); // 임시 상태 기준
                                            return (
                                                <div
                                                    key={emp.id}
                                                    onClick={() => handleRowClick(emp.id)}
                                                    className={cn(
                                                        "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors cursor-pointer group",
                                                        isChecked ? "bg-teal-50 text-primary font-bold" : "text-gray-600 hover:bg-gray-50"
                                                    )}
                                                >
                                                    {/* Checkbox Area */}
                                                    <div
                                                        onClick={(e) => handleCheckboxClick(e, emp.id)}
                                                        className="p-1 -ml-1 text-gray-400 hover:text-primary transition-colors cursor-pointer"
                                                    >
                                                        {isChecked ? (
                                                            <CheckSquare className="w-5 h-5 text-primary" />
                                                        ) : (
                                                            <Square className="w-5 h-5" />
                                                        )}
                                                    </div>

                                                    <span className="flex-1">{emp.name}</span>

                                                    {/* 단일 선택 힌트 (Only visible on hover/active in pure logic, but let's keep it clean) */}
                                                    {isChecked && <Check className="w-4 h-4 text-primary opacity-50" />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Sticky Bottom Actions */}
                            <div className="p-3 border-t border-gray-100 bg-white grid grid-cols-2 gap-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                                <button
                                    onClick={() => {
                                        setTempSelectedIds([]);
                                        // 전체 해제만 하고 닫지는 않음 (선택) or 닫음? -> UX상 초기화만 하는게 나을수도 있으나 '취소/닫기'가 없으므로... 
                                        // 여기서는 '전체 선택/해제' 기능보다는 그냥 선택 초기화(0명) 버튼으로 활용
                                    }}
                                    className="px-4 py-3 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
                                >
                                    선택 초기화
                                </button>
                                <button
                                    onClick={handleApply}
                                    className="px-4 py-3 rounded-xl text-sm font-bold bg-primary text-white hover:bg-teal-700 transition-colors shadow-md shadow-teal-200"
                                >
                                    적용 ({tempSelectedIds.length})
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
