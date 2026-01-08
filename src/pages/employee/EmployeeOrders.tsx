import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmployee } from '@/contexts/EmployeeContext';
import { EmployeeLayout } from '@/components/layout/EmployeeLayout';
import { Orders } from '@/pages/app/Orders';

export function EmployeeOrders() {
  const navigate = useNavigate();
  const { employee } = useEmployee();

  useEffect(() => {
    if (!employee) {
      navigate('/employee/login');
    } else if (!employee.permissions?.includes('orders')) {
      navigate('/employee/dashboard');
    }
  }, [employee, navigate]);

  if (!employee || !employee.permissions?.includes('orders')) {
    return null;
  }

  return (
    <EmployeeLayout>
      <Orders />
    </EmployeeLayout>
  );
}
