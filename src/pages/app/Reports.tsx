import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { useBusiness } from '@/contexts/BusinessContext';
import { ReportsService } from '@/services/reports.service';
import { AdvancedReportsService } from '@/services/advanced-reports.service';
import { EntitiesService, StatusService } from '@/services';
import { Tabs } from '@/components/ui/Tabs';
import { ReportsToolbar } from '@/components/reports/ReportsToolbar';
import { FiltersPanel } from '@/components/orders/FiltersPanel';
import { SavedReportModal } from '@/components/reports/SavedReportModal';
import { SavedReportsDropdown } from '@/components/reports/SavedReportsDropdown';
import { OverviewTab } from '@/components/reports/OverviewTab';
import { ProductsTab } from '@/components/reports/ProductsTab';
import { CustomersTab } from '@/components/reports/CustomersTab';
import { CarriersTab } from '@/components/reports/CarriersTab';
import { EmployeesTab } from '@/components/reports/EmployeesTab';
import { exportToCSV } from '@/utils/csv';
import type {
  ReportGroupBy,
  ReportFilters,
  ReportTab,
  AdvancedReportSummary,
  ProductPerformance,
  CustomerPerformance,
  CarrierPerformance,
  CityPerformance,
  EmployeePerformance,
  SavedReport,
} from '@/types/reports';
import type { Status, Country, Carrier, Employee } from '@/types/domain';

export function Reports() {
  const { currentBusiness } = useBusiness();

  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(today.toISOString().split('T')[0]);
  const [groupBy, setGroupBy] = useState<ReportGroupBy>('day');
  const [includeAdCost, setIncludeAdCost] = useState(false);

  const [countryId, setCountryId] = useState('');
  const [carrierId, setCarrierId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [statusId, setStatusId] = useState('');

  const [advancedSummary, setAdvancedSummary] = useState<AdvancedReportSummary | null>(null);
  const [products, setProducts] = useState<ProductPerformance[]>([]);
  const [customers, setCustomers] = useState<CustomerPerformance[]>([]);
  const [carriers, setCarriers] = useState<CarrierPerformance[]>([]);
  const [cities, setCities] = useState<CityPerformance[]>([]);
  const [employees, setEmployees] = useState<EmployeePerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [statuses, setStatuses] = useState<Status[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [carriersFilter, setCarriersFilter] = useState<Carrier[]>([]);
  const [employeesFilter, setEmployeesFilter] = useState<Employee[]>([]);

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);

  useEffect(() => {
    if (currentBusiness) {
      loadFilterOptions();
      loadSavedReports();
    }
  }, [currentBusiness]);

  useEffect(() => {
    if (currentBusiness) {
      loadAdvancedReports();
    }
  }, [currentBusiness, activeTab, dateFrom, dateTo, groupBy, includeAdCost, countryId, carrierId, employeeId, statusId]);

  const loadFilterOptions = async () => {
    if (!currentBusiness) return;

    try {
      const [statusesData, countriesData, carriersData, employeesData] = await Promise.all([
        StatusService.getStatuses(currentBusiness.id),
        EntitiesService.getCountries(currentBusiness.id),
        EntitiesService.getCarriers(currentBusiness.id),
        EntitiesService.getEmployees(currentBusiness.id),
      ]);

      setStatuses(statusesData);
      setCountries(countriesData);
      setCarriersFilter(carriersData);
      setEmployeesFilter(employeesData);
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  };

  const loadSavedReports = async () => {
    if (!currentBusiness) return;

    try {
      const reports = await ReportsService.getSavedReports(currentBusiness.id);
      setSavedReports(reports);
    } catch (error) {
      console.error('Failed to load saved reports:', error);
    }
  };

  const loadAdvancedReports = async () => {
    if (!currentBusiness) return;

    try {
      setIsLoading(true);

      const filters: ReportFilters = {
        date_from: dateFrom,
        date_to: dateTo,
        group_by: groupBy,
        include_ad_cost: includeAdCost,
      };

      if (countryId) filters.country_id = countryId;
      if (carrierId) filters.carrier_id = carrierId;
      if (employeeId) filters.employee_id = employeeId;
      if (statusId) filters.status_id = statusId;

      if (activeTab === 'overview') {
        const summary = await AdvancedReportsService.getAdvancedSummary(currentBusiness.id, filters);
        setAdvancedSummary(summary);
      } else if (activeTab === 'products') {
        const productsData = await AdvancedReportsService.getProductsPerformance(currentBusiness.id, filters);
        setProducts(productsData);
      } else if (activeTab === 'customers') {
        const customersData = await AdvancedReportsService.getCustomersPerformance(currentBusiness.id, filters);
        setCustomers(customersData);
      } else if (activeTab === 'carriers') {
        const [carriersData, citiesData] = await Promise.all([
          AdvancedReportsService.getCarriersPerformance(currentBusiness.id, filters),
          AdvancedReportsService.getCitiesPerformance(currentBusiness.id, filters),
        ]);
        setCarriers(carriersData);
        setCities(citiesData);
      } else if (activeTab === 'employees') {
        const employeesData = await AdvancedReportsService.getEmployeesPerformance(currentBusiness.id, filters);
        setEmployees(employeesData);
      }
    } catch (error) {
      console.error('Failed to load advanced reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    let data: any[] = [];
    let headers: any[] = [];
    let filename = '';

    if (activeTab === 'products') {
      data = products;
      headers = [
        { key: 'name', label: 'المنتج' },
        { key: 'category_name', label: 'الفئة' },
        { key: 'total_orders', label: 'عدد الطلبات' },
        { key: 'revenue', label: 'الإيرادات' },
        { key: 'profit', label: 'الربح' },
        { key: 'delivery_rate', label: 'نسبة التسليم' },
      ];
      filename = `products-report-${dateFrom}-${dateTo}.csv`;
    } else if (activeTab === 'customers') {
      data = customers;
      headers = [
        { key: 'name', label: 'العميل' },
        { key: 'phone', label: 'الهاتف' },
        { key: 'total_orders', label: 'عدد الطلبات' },
        { key: 'total_revenue', label: 'الإيرادات' },
        { key: 'avg_order_value', label: 'متوسط الطلب' },
      ];
      filename = `customers-report-${dateFrom}-${dateTo}.csv`;
    } else if (activeTab === 'carriers') {
      data = carriers;
      headers = [
        { key: 'name', label: 'الشركة' },
        { key: 'total_orders', label: 'عدد الطلبات' },
        { key: 'delivery_rate', label: 'نسبة التسليم' },
        { key: 'total_shipping_cost', label: 'تكلفة الشحن' },
      ];
      filename = `carriers-report-${dateFrom}-${dateTo}.csv`;
    } else if (activeTab === 'employees') {
      data = employees;
      headers = [
        { key: 'name', label: 'الموظف' },
        { key: 'total_orders', label: 'عدد الطلبات' },
        { key: 'delivery_rate', label: 'نسبة التسليم' },
        { key: 'revenue', label: 'الإيرادات' },
      ];
      filename = `employees-report-${dateFrom}-${dateTo}.csv`;
    }

    if (data.length > 0) {
      exportToCSV(data, filename, headers);
    }
  };

  const handleSaveReport = async (name: string) => {
    if (!currentBusiness) return;

    try {
      const filters: Partial<ReportFilters> = {};
      if (countryId) filters.country_id = countryId;
      if (carrierId) filters.carrier_id = carrierId;
      if (employeeId) filters.employee_id = employeeId;
      if (statusId) filters.status_id = statusId;
      if (includeAdCost) filters.include_ad_cost = includeAdCost;

      await ReportsService.createSavedReport(currentBusiness.id, {
        name,
        group_by: groupBy,
        filters_json: filters,
      });

      await loadSavedReports();
    } catch (error) {
      console.error('Failed to save report:', error);
    }
  };

  const handleSelectSavedReport = (report: SavedReport) => {
    setGroupBy(report.group_by);
    setCountryId(report.filters_json.country_id || '');
    setCarrierId(report.filters_json.carrier_id || '');
    setEmployeeId(report.filters_json.employee_id || '');
    setStatusId(report.filters_json.status_id || '');
    setIncludeAdCost(report.filters_json.include_ad_cost || false);
  };

  const handleDeleteSavedReport = async (reportId: string) => {
    try {
      await ReportsService.deleteSavedReport(reportId);
      await loadSavedReports();
    } catch (error) {
      console.error('Failed to delete saved report:', error);
    }
  };

  const handleApplyFilters = (filters: any) => {
    setCountryId(filters.country_id || '');
    setCarrierId(filters.carrier_id || '');
    setEmployeeId(filters.employee_id || '');
    setStatusId(filters.status_id || '');
    setIsFiltersOpen(false);
  };

  if (!currentBusiness) {
    return (
      <>
        <PageHeader title="التقارير" description="تقارير يومية وأسبوعية وشهرية" />
        <div className="text-center py-12">
          <p className="text-zinc-600">لم يتم تحديد وورك سبيس</p>
        </div>
      </>
    );
  }

  const tabs = [
    { id: 'overview' as ReportTab, label: 'نظرة عامة' },
    { id: 'products' as ReportTab, label: 'المنتجات' },
    { id: 'customers' as ReportTab, label: 'العملاء' },
    { id: 'carriers' as ReportTab, label: 'الشحن والمدن' },
    { id: 'employees' as ReportTab, label: 'الموظفين' },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="التقارير المتقدمة" description="تقارير شاملة وتحليلات تفصيلية للبيزنس" />
        <SavedReportsDropdown
          reports={savedReports}
          onSelect={handleSelectSavedReport}
          onDelete={handleDeleteSavedReport}
          canDelete={true}
        />
      </div>

      <ReportsToolbar
        dateFrom={dateFrom}
        dateTo={dateTo}
        groupBy={groupBy}
        includeAdCost={includeAdCost}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onGroupByChange={setGroupBy}
        onIncludeAdCostChange={setIncludeAdCost}
        onRefresh={loadAdvancedReports}
        onExport={handleExportCSV}
        onSaveReport={() => setIsSaveModalOpen(true)}
        onShowFilters={() => setIsFiltersOpen(true)}
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      <div className="mt-6">
        {activeTab === 'overview' && (
          <OverviewTab
            summary={advancedSummary || {
              total_orders: 0,
              delivered_orders: 0,
              return_orders: 0,
              delivery_rate: 0,
              gross_sales: 0,
              net_profit: 0,
              aov: 0,
              total_cost: 0,
              total_cogs: 0,
              total_shipping: 0,
              total_ad_cost: 0,
              total_cod_fees: 0,
              net_profit_before_ads: 0,
              profit_margin: 0,
              average_order_cost: 0,
              cost_to_revenue_ratio: 0,
              new_customers: 0,
              repeat_customers: 0,
              pending_orders: 0,
              active_orders: 0,
              late_orders: 0,
              average_delivery_time: 0,
              first_attempt_success_rate: 0,
              cod_collected: 0,
              cod_pending: 0,
              collection_rate: 0,
            }}
            isLoading={isLoading}
          />
        )}
        {activeTab === 'products' && (
          <ProductsTab products={products} isLoading={isLoading} />
        )}
        {activeTab === 'customers' && (
          <CustomersTab customers={customers} isLoading={isLoading} />
        )}
        {activeTab === 'carriers' && (
          <CarriersTab carriers={carriers} cities={cities} isLoading={isLoading} />
        )}
        {activeTab === 'employees' && (
          <EmployeesTab employees={employees} isLoading={isLoading} />
        )}
      </div>

      <FiltersPanel
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        filters={{
          country_id: countryId,
          carrier_id: carrierId,
          employee_id: employeeId,
          status_id: statusId,
        }}
        onApply={handleApplyFilters}
        statuses={statuses}
        countries={countries}
        carriers={carriersFilter}
        employees={employeesFilter}
      />

      <SavedReportModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveReport}
      />
    </>
  );
}
