import { createContext, useContext, useState, type ReactNode } from 'react';

interface DateFilterContextType {
    year: number;
    month: number | 'ALL';
    setYear: (year: number) => void;
    setMonth: (month: number | 'ALL') => void;
}

const DateFilterContext = createContext<DateFilterContextType | undefined>(undefined);

export function DateFilterProvider({ children }: { children: ReactNode }) {
    const today = new Date();
    const [year, setYear] = useState<number>(today.getFullYear());
    const [month, setMonth] = useState<number | 'ALL'>(today.getMonth() + 1); // 1-12 or 'ALL'

    return (
        <DateFilterContext.Provider value={{ year, month, setYear, setMonth }}>
            {children}
        </DateFilterContext.Provider>
    );
}

export function useDateFilter() {
    const context = useContext(DateFilterContext);
    if (!context) {
        throw new Error('useDateFilter must be used within a DateFilterProvider');
    }
    return context;
}
