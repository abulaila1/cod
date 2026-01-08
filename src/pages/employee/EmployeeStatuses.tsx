import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmployee } from '@/contexts/EmployeeContext';
import { EmployeeLayout } from '@/components/layout/EmployeeLayout';
import { Statuses } from '@/pages/app/Statuses';

export function EmployeeStatuses() {
  const navigate = useNavigate();
  const { employee } = useEmployee();

  useEffect(() => {
    if (!employee) {
      navigate('/employee/login');
    } else if (!employee.permissions?.includes('statuses')) {
      navigate('/employee/dashboard');
    }
  }, [employee, navigate]);

  if (!employee || !employee.permissions?.includes('statuses')) {
    return null;
  }

  return (
    <EmployeeLayout>
      <Statuses />
    </EmployeeLayout>
  );
}
