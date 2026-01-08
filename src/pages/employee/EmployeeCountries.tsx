import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmployee } from '@/contexts/EmployeeContext';
import { EmployeeLayout } from '@/components/layout/EmployeeLayout';
import { Countries } from '@/pages/app/Countries';

export function EmployeeCountries() {
  const navigate = useNavigate();
  const { employee } = useEmployee();

  useEffect(() => {
    if (!employee) {
      navigate('/employee/login');
    } else if (!employee.permissions?.includes('countries')) {
      navigate('/employee/dashboard');
    }
  }, [employee, navigate]);

  if (!employee || !employee.permissions?.includes('countries')) {
    return null;
  }

  return (
    <EmployeeLayout>
      <Countries />
    </EmployeeLayout>
  );
}
