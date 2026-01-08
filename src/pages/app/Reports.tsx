import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { PageHeader } from '@/components/common/PageHeader';
import { useBusiness } from '@/contexts/BusinessContext';
import { ReportsService } from '@/services/reports.service';
import { EntitiesService, StatusService } from '@/services';
import { ReportsSummary } from '@/components/reports/ReportsSummary';
import { ReportsTable } from '@/components/reports/ReportsTable';
import { ReportsToolbar } from '@/components/reports/ReportsToolbar';
import { FiltersPanel } from '@/components/orders/FiltersPanel';
import { SavedReportModal } from '@/components/reports/SavedReportModal';
import { SavedReportsDropdown } from '@/components/reports/SavedReportsDropdown';
import { exportToCSV } from '@/utils/csv';
import type {
  ReportGroupBy,
  ReportFilters,
  ReportSummary,
  ReportRow,
  SavedReport,
} from '@/types/reports';
import type { Status, Country, Carrier, Employee } from '@/types/domain';

export function Reports() {
  const { currentBusiness } = useBusiness();

  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(today.toISOString().split('T')[0]);
  const [groupBy, setGroupBy] = useState<ReportGroupBy>('day');
  const [includeAdCost, setIncludeAdCost] = useState(false);

  const [countryId, setCountryId] = useState('');
  const [carrierId, setCarrierId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [statusId, setStatusId] = useState('');

  const [summary, setSummary] = useState<ReportSummary>({
    total_orders: 0,
    delivered_orders: 0,
    return_orders: 0,
    delivery_rate: 0,
    gross_sales: 0,
    net_profit: 0,
    aov: 0,
  });
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [statuses, setStatuses] = useState<Status[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

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
      loadReports();
    }
  }, [currentBusiness, dateFrom, dateTo, groupBy, includeAdCost, countryId, carrierId, employeeId, statusId]);

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
      setCarriers(carriersData);
      setEmployees(employeesData);
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

  const loadReports = async () => {
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

      const [summaryData, tableData] = await Promise.all([
        ReportsService.getSummary(currentBusiness.id, filters),
        ReportsService.getTableData(currentBusiness.id, filters),
      ]);

      setSummary(summaryData);
      setRows(tableData.rows);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      { key: 'period_label', label: 'الفترة' },
      { key: 'total_orders', label: 'إجمالي الطلبات' },
      { key: 'delivered_orders', label: 'تم التوصيل' },
      { key: 'return_orders', label: 'مرتجع' },
      { key: 'delivery_rate', label: 'نسبة التسليم %' },
      { key: 'gross_sales', label: 'الإيرادات' },
      { key: 'net_profit', label: 'صافي الربح' },
      { key: 'aov', label: 'متوسط قيمة الطلب' },
    ];

    const filename = `report-${groupBy}-${dateFrom}-${dateTo}.csv`;

    exportToCSV(rows, filename, headers);
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
      <AppLayout pageTitle="التقارير">
        <PageHeader title="التقارير" description="تقارير يومية وأسبوعية وشهرية" />
        <div className="text-center py-12">
          <p className="text-zinc-600">لم يتم تحديد وورك سبيس</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="التقارير">
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="التقارير" description="تقارير يومية وأسبوعية وشهرية" />
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
        onRefresh={loadReports}
        onExport={handleExportCSV}
        onSaveReport={() => setIsSaveModalOpen(true)}
        onShowFilters={() => setIsFiltersOpen(true)}
      />

      <ReportsSummary summary={summary} isLoading={isLoading} />

      <ReportsTable
        rows={rows}
        groupBy={groupBy}
        filters={{ country_id: countryId, carrier_id: carrierId, employee_id: employeeId, status_id: statusId }}
      />

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
        carriers={carriers}
        employees={employees}
      />

      <SavedReportModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveReport}
      />
    </AppLayout>
  );
}
