import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { EmployeesService, type Employee } from '@/services/employees.service';

interface EmployeeContextValue {
  employee: Employee | null;
  isLoading: boolean;
  login: (businessId: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const EmployeeContext = createContext<EmployeeContextValue | undefined>(undefined);

export function EmployeeProvider({ children }: { children: ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedEmployee = localStorage.getItem('employee_session');
    if (savedEmployee) {
      try {
        setEmployee(JSON.parse(savedEmployee));
      } catch (error) {
        console.error('Failed to parse employee session:', error);
        localStorage.removeItem('employee_session');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (businessId: string, email: string, password: string) => {
    const employeeData = await EmployeesService.login(businessId, email, password);
    if (!employeeData) {
      throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }
    setEmployee(employeeData);
    localStorage.setItem('employee_session', JSON.stringify(employeeData));
  };

  const logout = () => {
    setEmployee(null);
    localStorage.removeItem('employee_session');
  };

  return (
    <EmployeeContext.Provider value={{ employee, isLoading, login, logout }}>
      {children}
    </EmployeeContext.Provider>
  );
}

export function useEmployee() {
  const context = useContext(EmployeeContext);
  if (!context) {
    throw new Error('useEmployee must be used within EmployeeProvider');
  }
  return context;
}
