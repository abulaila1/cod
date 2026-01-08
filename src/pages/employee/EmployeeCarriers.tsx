import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmployee } from '@/contexts/EmployeeContext';
import { EmployeeLayout } from '@/components/layout/EmployeeLayout';
import { Carriers } from '@/pages/app/Carriers';

export function EmployeeCarriers() {
  const navigate = useNavigate();
  const { employee } = useEmployee();

  useEffect(() => {
    if (!employee) {
      navigate('/employee/login');
    } else if (!employee.permissions?.includes('carriers')) {
      navigate('/employee/dashboard');
    }
  }, [employee, navigate]);

  if (!employee || !employee.permissions?.includes('carriers')) {
    return null;
  }

  return (
    <EmployeeLayout>
      <Carriers />
    </EmployeeLayout>
  );
}
