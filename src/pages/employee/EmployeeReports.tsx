import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmployee } from '@/contexts/EmployeeContext';
import { EmployeeLayout } from '@/components/layout/EmployeeLayout';
import { Reports } from '@/pages/app/Reports';

export function EmployeeReports() {
  const navigate = useNavigate();
  const { employee } = useEmployee();

  useEffect(() => {
    if (!employee) {
      navigate('/employee/login');
    } else if (!employee.permissions?.includes('reports')) {
      navigate('/employee/dashboard');
    }
  }, [employee, navigate]);

  if (!employee || !employee.permissions?.includes('reports')) {
    return null;
  }

  return (
    <EmployeeLayout>
      <Reports />
    </EmployeeLayout>
  );
}
