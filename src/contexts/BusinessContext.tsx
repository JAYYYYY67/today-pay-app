import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Business, Employee, WorkLog } from '../types';

interface BusinessContextType {
    businesses: Business[];
    currentBusinessId: string;
    currentBusiness: Business | undefined;
    addBusiness: (name: string) => void;
    updateBusiness: (id: string, name: string) => void;
    deleteBusiness: (id: string) => void;
    switchBusiness: (id: string) => void;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: ReactNode }) {
    const [businesses, setBusinesses] = useLocalStorage<Business[]>('businesses', []);
    const [currentBusinessId, setCurrentBusinessId] = useLocalStorage<string>('currentBusinessId', '1');

    // For Migration
    const [employees, setEmployees] = useLocalStorage<Employee[]>('employees', []);
    const [workLogs, setWorkLogs] = useLocalStorage<WorkLog[]>('workLogs', []);

    // --- Migration Logic ---
    useEffect(() => {
        let hasChanges = false;

        // 1. Initialize Businesses if empty
        if (businesses.length === 0) {
            const defaultBusiness = { id: '1', name: '본점' };
            setBusinesses([defaultBusiness]);
            setCurrentBusinessId('1');
            // Initialized default business
            // Note: We don't return here because we might need to migrate employees/logs even if we just created the business
            // but in strict React strict mode, `businesses` might be empty on first render.
        }

        // 2. Migrate Employees
        const migratedEmployees = employees.map(emp => {
            if (!emp.businessId) {
                hasChanges = true;
                return { ...emp, businessId: '1' };
            }
            return emp;
        });

        // 3. Migrate WorkLogs
        const migratedWorkLogs = workLogs.map(log => {
            if (!log.businessId) {
                hasChanges = true;
                return { ...log, businessId: '1' };
            }
            return log;
        });

        // Apply changes if needed
        if (hasChanges) {
            console.log('[Migration] Migrated data to businessId: 1');
            // We need to be careful not to cycle endlessly. 
            // Comparing stringified JSON is one way, but here we rely on the fact that we only change if businessId is missing.
            if (JSON.stringify(migratedEmployees) !== JSON.stringify(employees)) {
                setEmployees(migratedEmployees);
            }
            if (JSON.stringify(migratedWorkLogs) !== JSON.stringify(workLogs)) {
                setWorkLogs(migratedWorkLogs);
            }
        }
    }, [businesses, employees, workLogs, setBusinesses, setCurrentBusinessId, setEmployees, setWorkLogs]);


    const addBusiness = (name: string) => {
        const newBusiness: Business = {
            id: Date.now().toString(),
            name,
        };
        setBusinesses(prev => [...prev, newBusiness]);
        setCurrentBusinessId(newBusiness.id); // Switch to new business immediately
    };

    const updateBusiness = (id: string, name: string) => {
        setBusinesses(prev => prev.map(b => b.id === id ? { ...b, name } : b));
    };

    const deleteBusiness = (id: string) => {
        if (businesses.length <= 1) {
            alert('최소 하나의 사업장은 있어야 합니다.');
            return;
        }

        if (window.confirm('정말로 이 사업장을 삭제하시겠습니까?\n소속된 직원과 근무 기록은 유지되지만 접근할 수 없게 될 수 있습니다.')) {
            setBusinesses(prev => prev.filter(b => b.id !== id));
            if (currentBusinessId === id) {
                const remains = businesses.filter(b => b.id !== id);
                setCurrentBusinessId(remains[0].id);
            }
        }
    };

    const switchBusiness = (id: string) => {
        if (businesses.some(b => b.id === id)) {
            setCurrentBusinessId(id);
        }
    };

    const currentBusiness = businesses.find(b => b.id === currentBusinessId) || businesses[0];

    return (
        <BusinessContext.Provider value={{
            businesses,
            currentBusinessId,
            currentBusiness,
            addBusiness,
            updateBusiness,
            deleteBusiness,
            switchBusiness
        }}>
            {children}
        </BusinessContext.Provider>
    );
}

export function useBusiness() {
    const context = useContext(BusinessContext);
    if (context === undefined) {
        throw new Error('useBusiness must be used within a BusinessProvider');
    }
    return context;
}
