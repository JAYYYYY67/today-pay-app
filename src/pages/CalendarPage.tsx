import { useState, useMemo } from 'react';
import {
    format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
    eachDayOfInterval, addMonths, subMonths, isSameMonth, isSameDay
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, X, CheckCircle2, Pencil } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { type Employee, type WorkLog } from '../types';
import { cn } from '../utils/cn';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { generateId } from '../utils/id';
import { useDateFilter } from '../contexts/DateFilterContext';
import EmployeeFilter from '../components/common/EmployeeFilter';
import { getHolidayName } from '../utils/holidays';

import { useBusiness } from '../contexts/BusinessContext';

export default function CalendarPage() {
    // Global Date State
    const { year, month, setYear, setMonth } = useDateFilter();
    const { currentBusinessId } = useBusiness();

    // Local Filter State
    const [filterMode, setFilterMode] = useState<'ALL' | 'ACTIVE' | 'RETIRED'>('ACTIVE');
    const [filteredEmployeeIds, setFilteredEmployeeIds] = useState<string[]>([]);

    // Data
    const [allWorkLogs, setAllWorkLogs] = useLocalStorage<WorkLog[]>('workLogs', []);
    const [allEmployees] = useLocalStorage<Employee[]>('employees', []);

    // Filter by Current Business
    const employees = useMemo(() => allEmployees.filter(e => e.businessId === currentBusinessId), [allEmployees, currentBusinessId]);
    const workLogs = useMemo(() => allWorkLogs.filter(l => l.businessId === currentBusinessId), [allWorkLogs, currentBusinessId]);

    // Form State (Modal)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(''); // Valid employee ID
    const [hours, setHours] = useState('');
    const [memo, setMemo] = useState('');
    const [isNightShift, setIsNightShift] = useState(false); // 야간수당
    const [isRepeatMode, setIsRepeatMode] = useState(false); // 반복 모드
    const [repeatDays, setRepeatDays] = useState<number[]>([]); // 0(일) ~ 6(토)
    const [repeatDuration, setRepeatDuration] = useState(3); // 1, 3, 6 months
    const [editingLogId, setEditingLogId] = useState<string | null>(null);

    // Derived Date
    const currentDate = useMemo(() => {
        if (month === 'ALL') return new Date(year, 0, 1);
        return new Date(year, month - 1, 1);
    }, [year, month]);

    const days = useMemo(() => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);
        return eachDayOfInterval({ start: startDate, end: endDate });
    }, [currentDate]);

    // Handlers for month navigation (Syncs with Global Context)
    const handlePrevMonth = () => {
        const newDate = subMonths(currentDate, 1);
        setYear(newDate.getFullYear());
        setMonth(newDate.getMonth() + 1);
    };

    const handleNextMonth = () => {
        const newDate = addMonths(currentDate, 1);
        setYear(newDate.getFullYear());
        setMonth(newDate.getMonth() + 1);
    };

    const handleDateClick = (date: Date) => {
        setSelectedDate(date);

        // Reset form - 필터 상태에 따라 초기 선택 직원 자동 설정
        if (filteredEmployeeIds.length === 1) {
            setSelectedEmployeeId(filteredEmployeeIds[0]);
        } else {
            setSelectedEmployeeId('');
        }

        setHours('');
        setMemo('');
        setIsNightShift(false);
        setEditingLogId(null);

        // 반복 모드 기본값 True 및 현재 요일 자동 선택
        setIsRepeatMode(true);
        setRepeatDays([date.getDay()]);
        setRepeatDuration(3);
    };

    const handleEditLog = (log: WorkLog) => {
        if (log.isLocked) {
            alert('이미 지급 완료(마감)된 근무 기록은 수정할 수 없습니다.');
            return;
        }

        setEditingLogId(log.id);
        setSelectedEmployeeId(log.employeeId);

        if (log.hours) setHours(log.hours.toString());
        else if (log.count) setHours(log.count.toString());
        else setHours('');

        setMemo(log.memo || '');
        setIsNightShift(!!log.isNightShift);

        // 수정 시에는 반복 모드 끔 (단일 수정)
        setIsRepeatMode(false);
        setRepeatDays([]);

        const formElement = document.getElementById('log-form');
        if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
    };

    const activeEmployees = useMemo(() => employees.filter(e => e.active), [employees]);

    const handleSaveLog = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDate || !selectedEmployeeId) return;

        const employee = employees.find(e => e.id === selectedEmployeeId);
        if (!employee) return;

        // 수정 또는 생성을 위한 공통 데이터
        const logData: Partial<WorkLog> = {
            employeeId: selectedEmployeeId,
            date: format(selectedDate, 'yyyy-MM-dd'),
            memo,
            // Snapshot Data Integrity
            snapshot: {
                hourlyRate: employee.amount,
                taxRate: employee.taxRate,
                employeeName: employee.name
            },
            // Night Shift
            isNightShift,
            businessId: currentBusinessId, // Assign current business
        };

        if (employee.paymentType === 'HOURLY') {
            logData.hours = parseFloat(hours) || 0;
            logData.count = undefined;
        } else {
            logData.count = parseFloat(hours) || 1;
            logData.hours = undefined;
        }

        // ... (앞부분 생략)
        if (editingLogId) {
            setAllWorkLogs(prev => prev.map(log =>
                log.id === editingLogId
                    ? { ...log, ...logData, snapshot: log.snapshot || logData.snapshot }
                    : log
            ));
        } else {
            // 생성 모드 (단일 or 반복)
            if (isRepeatMode) {
                const startDate = selectedDate;
                const endDate = addMonths(startDate, repeatDuration);
                const dates = eachDayOfInterval({ start: startDate, end: endDate });

                const newLogs: WorkLog[] = [];
                let addedCount = 0;
                let skippedCount = 0;

                // 반복 그룹 ID 생성 (Timestamp + Random)
                const newGroupId = `repeat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                dates.forEach(date => {
                    // 1. 요일 체크
                    if (!repeatDays.includes(date.getDay())) return;

                    // 2. 중복 체크 (해당 직원, 해당 날짜에 이미 기록이 있으면 스킵)
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const exists = workLogs.some(log => log.employeeId === selectedEmployeeId && log.date === dateStr);

                    if (exists) {
                        skippedCount++;
                        return;
                    }

                    newLogs.push({
                        id: generateId(), // 주의: generateId가 충분히 랜덤해야 함 (순간적 루프로 중복 안나게)
                        createdAt: Date.now(),
                        ...logData,
                        repeatGroupId: newGroupId, // 그룹 ID 주입
                        date: dateStr // 날짜만 변경
                    } as WorkLog);
                    addedCount++;
                });

                if (newLogs.length > 0) {
                    setAllWorkLogs(prev => [...prev, ...newLogs]);
                    alert(`총 ${addedCount}건의 근무가 등록되었습니다.\n(중복된 ${skippedCount}건은 제외됨)`);
                } else {
                    alert('등록된 근무가 없거나 모든 날짜에 이미 기록이 존재합니다.');
                }

            } else {
                // 단일 생성
                const newLog: WorkLog = {
                    id: generateId(),
                    createdAt: Date.now(),
                    ...logData
                } as WorkLog;
                setAllWorkLogs(prev => [...prev, newLog]);
            }
        }

        // Reset form
        if (filteredEmployeeIds.length === 1) {
            setSelectedEmployeeId(filteredEmployeeIds[0]);
        } else {
            setSelectedEmployeeId('');
        }
        setHours('');
        setMemo('');
        setIsNightShift(false);
        setIsRepeatMode(false); // 리셋
        setRepeatDays([]);
        setEditingLogId(null);
    };

    const getDayLogs = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return workLogs.filter(log => {
            const dateMatch = log.date === dateStr;

            // Filter Logic
            if (!dateMatch) return false;

            // 1. 선택된 직원이 있으면 그들만 포함
            if (filteredEmployeeIds.length > 0) {
                return filteredEmployeeIds.includes(log.employeeId);
            }

            // 2. ALL 모드면 (필터링된 직원이 없을 때) 무조건 포함 (타 지점 직원 기록도 포함)
            if (filterMode === 'ALL') return true;

            // 3. ACTIVE/RETIRED 모드 -> 현재 지점 소속 직원 중에서 상태 체크
            // (타 지점으로 간 직원은 이 모드들에선 제외됨 - 의도된 동작일 수 있음)
            const emp = allEmployees.find(e => e.id === log.employeeId);
            if (!emp) return false;

            // 현재 지점 소속이 아니면 ACTIVE/RETIRED 탭에서는 안 보여주는 게 자연스러움 (목록에 없으므로)
            if (emp.businessId !== currentBusinessId) return false;

            if (filterMode === 'ACTIVE') return !emp.isRetired;
            if (filterMode === 'RETIRED') return emp.isRetired;
            return false;
        });
    };

    const [deletingLog, setDeletingLog] = useState<WorkLog | null>(null); // For recurring delete modal

    const handleDeleteOption = (option: 'ONLY' | 'FUTURE' | 'ALL') => {
        if (!deletingLog) return;

        let targetIds: string[] = [];

        if (option === 'ONLY') {
            targetIds = [deletingLog.id];
        } else if (option === 'FUTURE') {
            // 같은 그룹이면서 날짜가 같거나(본인) 미래인 것들
            targetIds = workLogs
                .filter(l => l.repeatGroupId === deletingLog.repeatGroupId && l.date >= deletingLog.date)
                .map(l => l.id);
        } else if (option === 'ALL') {
            // 같은 그룹 전체
            targetIds = workLogs
                .filter(l => l.repeatGroupId === deletingLog.repeatGroupId)
                .map(l => l.id);
        }

        setAllWorkLogs(prev => prev.filter(l => !targetIds.includes(l.id)));

        // Cleanup UI if deleted log was being edited
        if (targetIds.includes(editingLogId || '')) {
            setEditingLogId(null);
            setHours('');
            setMemo('');
            setIsNightShift(false);
            setIsRepeatMode(false);
        }

        setDeletingLog(null); // Close modal
    };

    const removeLog = (logId: string) => {
        const targetLog = workLogs.find(l => l.id === logId);
        if (!targetLog) return;

        if (targetLog.isLocked) {
            alert('이미 지급 완료(마감)된 근무 기록은 삭제할 수 없습니다.');
            return;
        }

        // 반복 일정 그룹인지 확인
        if (targetLog.repeatGroupId) {
            setDeletingLog(targetLog); // Open options modal
        } else {
            // 일반 삭제
            if (window.confirm('정말 삭제하시겠습니까?')) {
                setAllWorkLogs(prev => prev.filter(l => l.id !== logId));
                if (editingLogId === logId) {
                    setEditingLogId(null);
                    setHours('');
                    setMemo('');
                    setIsNightShift(false);
                    setIsRepeatMode(false);
                }
            }
        }
    };

    const checkWeeklyHoliday = (date: Date) => {
        // 단일 직원 선택 시에만 주휴수당 하이라이트 표시
        if (filteredEmployeeIds.length !== 1) return false;

        const targetId = filteredEmployeeIds[0];

        const weekStart = startOfWeek(date, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(date, { weekStartsOn: 1 });

        const logsInWeek = workLogs.filter(log => {
            const d = new Date(log.date);
            return d >= weekStart && d <= weekEnd;
        });

        const myLogs = logsInWeek.filter(log => log.employeeId === targetId);

        let totalHours = 0;
        myLogs.forEach(log => {
            const emp = employees.find(e => e.id === log.employeeId);
            if (emp && emp.paymentType === 'HOURLY') {
                totalHours += (log.hours || 0);
            }
        });

        return totalHours >= 15;
    };

    // Helper to determine text color
    const getDayColor = (date: Date) => {
        const day = date.getDay(); // 0: Sun, 6: Sat
        const isHoliday = !!getHolidayName(date);

        if (day === 0 || isHoliday) return 'text-red-500';
        if (day === 6) return 'text-teal-600';
        return 'text-gray-900';
    };

    const isModalOpen = !!selectedDate;

    return (
        <div className="min-h-full w-full max-w-full overflow-x-hidden bg-white">
            {/* Header / Month Navigation */}
            <div className="flex items-center justify-between p-5 pb-2">
                <h1 className="text-xl font-bold">
                    {month === 'ALL' ? `${year}년` : format(currentDate, 'yyyy년 M월', { locale: ko })}
                </h1>
                <div className="flex gap-2">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-full">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-full">
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Employee Filter Bar */}
            <EmployeeFilter
                employees={employees}
                selectedIds={filteredEmployeeIds}
                onSelect={setFilteredEmployeeIds}
                mode={filterMode}
                onModeChange={setFilterMode}
            />

            {/* Week Days */}
            <div className="grid grid-cols-7 text-center text-lg font-bold text-gray-500 py-3 border-b border-gray-100">
                {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                    <div key={day} className={day === '일' ? 'text-red-500' : day === '토' ? 'text-teal-600' : ''}>{day}</div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 auto-rows-fr gap-1 p-2">
                {days.map((date) => {
                    const isCurrentMonth = isSameMonth(date, currentDate);
                    const dayLogs = getDayLogs(date);
                    const isToday = isSameDay(date, new Date());
                    const isWeeklyHoliday = checkWeeklyHoliday(date);
                    const holidayName = getHolidayName(date);
                    const dayColor = getDayColor(date);
                    const isSelected = selectedDate && isSameDay(date, selectedDate);

                    return (
                        <div
                            key={date.toString()}
                            onClick={() => handleDateClick(date)}
                            className={cn(
                                "min-h-[85px] rounded-2xl p-1 relative cursor-pointer flex flex-col items-center pt-1 transition-all duration-200 border-2", // min-h 늘림
                                isSelected
                                    ? "border-primary bg-teal-50/50 ring-2 ring-teal-100 ring-offset-2 z-10"
                                    : "border-transparent hover:bg-gray-50",
                                !isCurrentMonth && "opacity-30",
                                (isWeeklyHoliday && isCurrentMonth) && "bg-yellow-50/40"
                            )}
                        >
                            <span className={cn(
                                "text-xl w-9 h-9 flex items-center justify-center rounded-full font-bold mb-0.5 transition-transform", // text-xl, w-9 h-9
                                isToday ? "bg-primary text-white shadow-md scale-110" : dayColor
                            )}>
                                {format(date, 'd')}
                            </span>

                            {/* Holiday Name */}
                            {holidayName && (
                                <span className="text-xs text-red-500 font-medium truncate w-full text-center leading-none mb-1 px-1">
                                    {holidayName}
                                </span>
                            )}

                            {/* Name Badges for logs - New Visual */}
                            <div className="flex flex-col gap-0.5 w-full px-0.5 mt-auto pb-1 overflow-hidden">
                                {dayLogs.map((log) => {
                                    const emp = allEmployees.find(e => e.id === log.employeeId);
                                    const hasMemo = !!log.memo;
                                    return (
                                        <div
                                            key={log.id}
                                            className={cn(
                                                "w-full rounded text-[10px] font-bold truncate text-center py-0.5 leading-none px-0.5", // text-[10px]
                                                hasMemo
                                                    ? "bg-orange-100 text-orange-800"
                                                    : "bg-teal-50 text-teal-700"
                                            )}
                                        >
                                            {emp?.name}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedDate(null)} />

                    <div className="bg-white w-full max-w-md rounded-[2rem] p-6 relative z-10 animate-in zoom-in-95 duration-200 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-6 sticky top-0 bg-white/95 backdrop-blur z-20 pb-2 border-b border-gray-100">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                                    {selectedDate && format(selectedDate, 'M월 d일 (E)', { locale: ko })}
                                    {selectedDate && getHolidayName(selectedDate) && (
                                        <span className="text-xs bg-red-50 text-red-500 px-2.5 py-1 rounded-full border border-red-100 font-medium">
                                            {getHolidayName(selectedDate)}
                                        </span>
                                    )}
                                </h2>
                                <p className="text-gray-400 text-sm mt-0.5 font-medium">
                                    {filteredEmployeeIds.length === 1
                                        ? `${employees.find(e => e.id === filteredEmployeeIds[0])?.name}님의 기록`
                                        : '근무 기록 관리'}
                                </p>
                            </div>
                            <button onClick={() => setSelectedDate(null)} className="p-2.5 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors text-gray-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Logs List in Modal */}
                        {selectedDate && getDayLogs(selectedDate).length > 0 && (
                            <div className="mb-8 space-y-3">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-bold text-gray-800">
                                        등록된 근무
                                    </h3>
                                    <span className="text-xs font-bold bg-teal-100 text-primary px-2 py-0.5 rounded-full">
                                        {getDayLogs(selectedDate).length}
                                    </span>
                                </div>
                                {getDayLogs(selectedDate).map(log => {
                                    // 중요: allEmployees 참조
                                    const emp = allEmployees.find(e => e.id === log.employeeId);
                                    const isEditing = editingLogId === log.id;
                                    const hasMemo = !!log.memo;
                                    const isOtherBusiness = emp?.businessId !== currentBusinessId;

                                    return (
                                        <div
                                            key={log.id}
                                            className={cn(
                                                "flex justify-between items-center p-4 rounded-2xl text-sm transition-all border shadow-sm",
                                                isEditing
                                                    ? "bg-teal-50 border-teal-200 ring-1 ring-teal-200"
                                                    : "bg-white border-gray-100 hover:border-teal-200 hover:shadow-md",
                                                (emp?.isRetired || isOtherBusiness) && "bg-gray-50/50"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold",
                                                    hasMemo ? "bg-orange-50 text-orange-600" : "bg-gray-100 text-gray-600"
                                                )}>
                                                    {emp?.name[0]}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-gray-900 text-base">{emp?.name}</span>
                                                        {log.isNightShift && (
                                                            <span className="text-[10px] bg-teal-50 text-teal-600 px-1.5 py-0.5 rounded font-bold border border-teal-100">야간</span>
                                                        )}
                                                        {isOtherBusiness && !emp?.isRetired && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-bold border border-gray-200">타지점</span>}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs mt-0.5 font-medium">
                                                        {emp?.paymentType === 'HOURLY' && (
                                                            <span className="text-primary bg-teal-50 px-1.5 py-0.5 rounded">
                                                                {log.hours}시간
                                                            </span>
                                                        )}
                                                        {emp?.paymentType === 'DAILY' && <span className="text-green-600 bg-green-50 px-1.5 py-0.5 rounded">1일</span>}
                                                        {emp?.paymentType === 'PER_TASK' && <span className="text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">{log.count || 1}건</span>}

                                                        {hasMemo && <span className="text-gray-400 truncate max-w-[100px] block">{log.memo}</span>}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleEditLog(log)}
                                                    className="p-2 text-gray-400 hover:text-primary hover:bg-teal-50 rounded-xl transition-colors"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => removeLog(log.id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        <form id="log-form" onSubmit={handleSaveLog} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">직원 선택</label>
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    {activeEmployees.length === 0 && <p className="text-gray-400 text-sm">등록된 직원이 없습니다.</p>}
                                    {activeEmployees.map(emp => {
                                        const isSelected = selectedEmployeeId === emp.id;
                                        return (
                                            <button
                                                key={emp.id}
                                                type="button"
                                                onClick={() => setSelectedEmployeeId(emp.id)}
                                                className={cn(
                                                    "flex-shrink-0 px-4 py-2 rounded-xl border transition-all text-sm font-medium",
                                                    isSelected
                                                        ? "bg-primary text-white border-primary"
                                                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                                )}
                                            >
                                                {emp.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {selectedEmployeeId && (
                                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
                                    {(() => {
                                        const emp = employees.find(e => e.id === selectedEmployeeId);
                                        if (emp?.paymentType === 'HOURLY') {
                                            return (
                                                <div className="space-y-3">
                                                    <Input
                                                        label="근무 시간"
                                                        type="text"
                                                        inputMode="decimal"
                                                        step="0.5"
                                                        placeholder="예: 5"
                                                        value={hours}
                                                        onChange={(e) => {
                                                            const val = e.target.value.replace(/[^0-9.]/g, '');
                                                            setHours(val);
                                                        }}
                                                        required
                                                    />
                                                    <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            checked={isNightShift}
                                                            onChange={(e) => setIsNightShift(e.target.checked)}
                                                            className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                                        />
                                                        <span className="text-sm font-medium text-gray-700">야간수당 적용 (1.5배)</span>
                                                    </label>
                                                </div>
                                            );
                                        } else if (emp?.paymentType === 'PER_TASK') {
                                            return (
                                                <Input
                                                    label="건수"
                                                    type="text"
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    placeholder="예: 3"
                                                    value={hours}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                                        setHours(val);
                                                    }}
                                                    required
                                                />
                                            );
                                        } else {
                                            return (
                                                <div className="bg-teal-50 text-primary p-3 rounded-xl text-sm font-medium flex items-center gap-2">
                                                    <CheckCircle2 className="w-5 h-5 mb-0.5" />
                                                    <span>일당으로 자동 계산됩니다.</span>
                                                </div>
                                            )
                                        }
                                    })()}

                                    <Input
                                        label="메모 (선택)"
                                        placeholder="특이사항"
                                        value={memo}
                                        onChange={(e) => setMemo(e.target.value)}
                                    />

                                    <div className="pt-2 border-t border-gray-100">
                                        <label className="flex items-center gap-2 mb-3 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={isRepeatMode}
                                                onChange={(e) => {
                                                    setIsRepeatMode(e.target.checked);
                                                    if (e.target.checked && selectedDate) {
                                                        // 켜질 때 현재 요일 자동 선택
                                                        setRepeatDays([selectedDate.getDay()]);
                                                    }
                                                }}
                                                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            <span className="font-bold text-gray-700">이 근무 반복하기</span>
                                        </label>

                                        {isRepeatMode && (
                                            <div className="bg-gray-50 p-4 rounded-xl space-y-4 animate-in slide-in-from-top-2 fade-in duration-200">
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-500 mb-2">반복할 요일</p>
                                                    <div className="flex justify-between gap-1">
                                                        {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => {
                                                            const isSelected = repeatDays.includes(idx);
                                                            return (
                                                                <button
                                                                    key={day}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (isSelected) {
                                                                            if (repeatDays.length > 1) {
                                                                                setRepeatDays(prev => prev.filter(d => d !== idx));
                                                                            }
                                                                        } else {
                                                                            setRepeatDays(prev => [...prev, idx]);
                                                                        }
                                                                    }}
                                                                    className={cn(
                                                                        "w-9 h-9 rounded-lg text-sm font-bold transition-all border",
                                                                        isSelected
                                                                            ? "bg-primary text-white border-primary shadow-sm"
                                                                            : "bg-white text-gray-400 border-gray-200 hover:bg-gray-100",
                                                                        !isSelected && idx === 0 && "text-red-400",
                                                                        !isSelected && idx === 6 && "text-teal-400"
                                                                    )}
                                                                >
                                                                    {day}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                <div>
                                                    <p className="text-xs font-semibold text-gray-500 mb-2">반복 기간</p>
                                                    <div className="relative">
                                                        <select
                                                            value={repeatDuration}
                                                            onChange={(e) => setRepeatDuration(Number(e.target.value))}
                                                            className="w-full appearance-none bg-white border border-gray-200 text-gray-700 py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-primary transition-colors font-medium"
                                                        >
                                                            {[1, 2, 3, 4, 5, 6].map(m => (
                                                                <option key={m} value={m}>{m}개월 동안 반복</option>
                                                            ))}
                                                        </select>
                                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                                        </div>
                                                    </div>

                                                    <p className="text-[10px] text-gray-400 mt-2 text-center">
                                                        * 오늘부터 {repeatDuration}개월 뒤까지 해당 요일에 자동 등록됩니다.<br />
                                                        (이미 근무가 등록된 날짜는 건너뜁니다)
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        {/* ... (Buttons) */}
                                        {editingLogId && (
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                className="flex-1"
                                                onClick={() => {
                                                    setEditingLogId(null);
                                                    setHours('');
                                                    setMemo('');
                                                    setIsNightShift(false);
                                                    setIsRepeatMode(false);
                                                }}
                                            >
                                                취소
                                            </Button>
                                        )}
                                        <Button
                                            type="submit"
                                            className={cn("flex-[2]", editingLogId && "bg-primary hover:bg-teal-700")}
                                            fullWidth={!editingLogId}
                                        >
                                            {editingLogId ? '수정 완료' : (isRepeatMode ? '반복 일정 저장하기' : '저장하기')}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            )}
            {/* Delete Option Modal */}
            {deletingLog && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl scale-100 animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold mb-2">반복 일정 삭제</h3>
                        <p className="text-gray-600 mb-6 text-sm">
                            이 근무는 반복 일정의 일부입니다.<br />
                            어떻게 삭제하시겠습니까?
                        </p>

                        <div className="space-y-2">
                            <button
                                onClick={() => handleDeleteOption('ONLY')}
                                className="w-full py-3 px-4 bg-white border border-gray-200 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition-colors text-sm"
                            >
                                현재 근무만 삭제
                            </button>
                            <button
                                onClick={() => handleDeleteOption('FUTURE')}
                                className="w-full py-3 px-4 bg-white border border-gray-200 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition-colors text-sm"
                            >
                                향후 일정 모두 삭제<br />
                                <span className="text-xs font-normal text-gray-400">({format(new Date(deletingLog.date), 'M월 d일')} 이후 전체)</span>
                            </button>
                            <button
                                onClick={() => handleDeleteOption('ALL')}
                                className="w-full py-3 px-4 bg-white border border-gray-200 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition-colors text-sm"
                            >
                                연결된 모든 반복일정 삭제
                            </button>
                        </div>

                        <button
                            onClick={() => setDeletingLog(null)}
                            className="w-full mt-4 py-3 text-gray-400 font-medium hover:text-gray-600 transition-colors text-sm"
                        >
                            취소
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
