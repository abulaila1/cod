import { useState, useEffect } from 'react';
import { OrdersService } from '@/services/orders.service';
import { EntitiesService, StatusService } from '@/services';
import type {
  OrderWithRelations,
  OrderFilters,
  Status,
  Country,
  Carrier,
  Employee,
} from '@/types/domain';

export function useOrdersList(businessId: string | undefined) {
  const [orders, setOrders] = useState<OrderWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [pageCount, setPageCount] = useState(0);

  const [statuses, setStatuses] = useState<Status[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [filters, setFilters] = useState<OrderFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    if (businessId) {
      loadOrders();
      loadFilterOptions();
    }
  }, [businessId, filters, currentPage, pageSize, searchTerm]);

  const loadOrders = async () => {
    if (!businessId) return;

    try {
      setIsLoading(true);
      const searchFilters = searchTerm ? { ...filters, search: searchTerm } : filters;

      const response = await OrdersService.listOrders(
        businessId,
        searchFilters,
        { page: currentPage, pageSize },
        { field: 'order_date', direction: 'desc' }
      );

      setOrders(response.rows);
      setTotalCount(response.total_count);
      setPageCount(response.page_count);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    if (!businessId) return;

    try {
      const [statusesData, countriesData, carriersData, employeesData] = await Promise.all([
        StatusService.getStatuses(businessId),
        EntitiesService.getCountries(businessId),
        EntitiesService.getCarriers(businessId),
        EntitiesService.getEmployees(businessId),
      ]);

      setStatuses(statusesData);
      setCountries(countriesData);
      setCarriers(carriersData);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  };

  return {
    orders,
    isLoading,
    totalCount,
    pageCount,
    statuses,
    countries,
    carriers,
    employees,
    filters,
    setFilters,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    loadOrders,
  };
}
