import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button, Card, CardContent, Input } from '@/components/ui';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAuth } from '@/contexts/AuthContext';
import { OrdersService } from '@/services/orders.service';
import { useOrdersList } from '@/hooks/useOrdersList';
import { OrdersStatsBar } from '@/components/orders/OrdersStatsBar';
import { OrdersTable } from '@/components/orders/OrdersTable';
import { FiltersPanel } from '@/components/orders/FiltersPanel';
import { BulkActionsBar } from '@/components/orders/BulkActionsBar';
import { OrderDetailsDrawer } from '@/components/orders/OrderDetailsDrawer';
import { ImportModal } from '@/components/entity/ImportModal';
import type { OrderFilters } from '@/types/domain';
import { FileText, X, Search, Filter, Download, Upload, RefreshCw, Loader2 } from 'lucide-react';
import { generateOrderTemplate } from '@/utils/order-import';
import { parseImportFile } from '@/utils/file-parser';
import type { ImportResult } from '@/services/orders.service';

export function Orders() {
  const { currentBusiness } = useBusiness();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
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
  } = useOrdersList(currentBusiness?.id);

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [hasAppliedFilters, setHasAppliedFilters] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  useEffect(() => {
    const queryFilters: OrderFilters = {};
    let hasFilters = false;

    if (searchParams.get('date_from')) {
      queryFilters.date_from = searchParams.get('date_from')!;
      hasFilters = true;
    }
    if (searchParams.get('date_to')) {
      queryFilters.date_to = searchParams.get('date_to')!;
      hasFilters = true;
    }
    if (searchParams.get('country_id')) {
      queryFilters.country_id = searchParams.get('country_id')!;
      hasFilters = true;
    }
    if (searchParams.get('carrier_id')) {
      queryFilters.carrier_id = searchParams.get('carrier_id')!;
      hasFilters = true;
    }
    if (searchParams.get('employee_id')) {
      queryFilters.employee_id = searchParams.get('employee_id')!;
      hasFilters = true;
    }
    if (searchParams.get('status_id')) {
      queryFilters.status_id = searchParams.get('status_id')!;
      hasFilters = true;
    }

    if (hasFilters) {
      setFilters(queryFilters);
      setHasAppliedFilters(true);
    }
  }, []);

  const handleExportCsv = async () => {
    if (!currentBusiness) return;

    try {
      const csvContent = await OrdersService.exportOrdersCsv(currentBusiness.id, filters);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export CSV:', error);
    }
  };

  const handleDownloadTemplate = () => {
    const template = generateOrderTemplate();
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orders-template-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCsv = async (file: File): Promise<ImportResult> => {
    if (!currentBusiness || !user) {
      throw new Error('لم يتم تحديد وورك سبيس أو المستخدم');
    }

    try {
      const parsed = await parseImportFile(file);

      const csvContent = [
        parsed.headers.join(','),
        ...parsed.dataRows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      const result = await OrdersService.importOrdersStrict(
        currentBusiness.id,
        user.id,
        csvContent
      );

      if (result.success > 0) {
        loadOrders();
      }

      return result;
    } catch (error: unknown) {
      throw error;
    }
  };

  const handleBulkUpdateStatus = async (statusId: string) => {
    if (!currentBusiness || !user) return;

    try {
      await OrdersService.bulkUpdateStatus(
        currentBusiness.id,
        selectedOrderIds,
        statusId,
        user.id
      );
      setSelectedOrderIds([]);
      loadOrders();
    } catch (error) {
      console.error('Failed to bulk update:', error);
    }
  };

  const handleBulkAssignCarrier = async (carrierId: string) => {
    if (!currentBusiness || !user) return;

    try {
      await OrdersService.bulkAssignCarrier(
        currentBusiness.id,
        selectedOrderIds,
        carrierId,
        user.id
      );
      setSelectedOrderIds([]);
      loadOrders();
    } catch (error) {
      console.error('Failed to assign carrier:', error);
    }
  };

  const handleBulkAssignEmployee = async (employeeId: string) => {
    if (!currentBusiness || !user) return;

    try {
      await OrdersService.bulkAssignEmployee(
        currentBusiness.id,
        selectedOrderIds,
        employeeId,
        user.id
      );
      setSelectedOrderIds([]);
      loadOrders();
    } catch (error) {
      console.error('Failed to assign employee:', error);
    }
  };

  const handleExportSelected = async (format: 'csv' | 'carrier') => {
    if (!currentBusiness) return;

    try {
      let csvContent: string;

      if (format === 'csv') {
        csvContent = await OrdersService.exportOrdersCsv(currentBusiness.id, filters);
      } else {
        csvContent = await OrdersService.exportForCarrier(currentBusiness.id, selectedOrderIds, 'generic');
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  const handlePrintSelected = async () => {
    alert('ميزة الطباعة قيد التطوير');
  };

  const handleStatusChange = async (orderId: string, statusId: string) => {
    if (!currentBusiness || !user) return;

    try {
      await OrdersService.updateOrderStatus(currentBusiness.id, orderId, statusId, user.id);
      loadOrders();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleDuplicateOrder = async (orderId: string) => {
    if (!currentBusiness || !user) return;

    try {
      await OrdersService.duplicateOrder(currentBusiness.id, orderId, user.id);
      loadOrders();
    } catch (error) {
      console.error('Failed to duplicate order:', error);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrderIds(orders.map((o) => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrderIds([...selectedOrderIds, orderId]);
    } else {
      setSelectedOrderIds(selectedOrderIds.filter((id) => id !== orderId));
    }
  };

  const handleLateOrdersClick = () => {
    setFilters({
      ...filters,
      is_late: true,
      late_days: 5,
    });
    setCurrentPage(1);
  };

  const clearAppliedFilters = () => {
    setFilters({});
    setHasAppliedFilters(false);
    setSearchParams({});
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.date_from || filters.date_to) count++;
    if (filters.status_id) count++;
    if (filters.country_id) count++;
    if (filters.city_id) count++;
    if (filters.carrier_id) count++;
    if (filters.employee_id) count++;
    if (filters.product_id) count++;
    if (filters.collection_status) count++;
    if (filters.order_source) count++;
    if (filters.has_tracking !== undefined) count++;
    if (filters.is_late) count++;
    return count;
  };

  if (!currentBusiness) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-600">لم يتم تحديد وورك سبيس</p>
      </div>
    );
  }

  const currency = currentBusiness?.settings?.currency || 'ر.س';

  return (
    <>
      <PageHeader
        title="الطلبات"
        description="إدارة ومتابعة جميع الطلبات"
      />

      <OrdersStatsBar
        businessId={currentBusiness.id}
        currency={currency}
        onLateOrdersClick={handleLateOrdersClick}
      />

      {hasAppliedFilters && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-blue-900">
            تم تطبيق فلاتر من صفحة الأداء
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={clearAppliedFilters}
          >
            <X className="ml-2 h-4 w-4" />
            إزالة الفلاتر
          </Button>
        </div>
      )}

      <Card className="mb-6">
        <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 w-full sm:max-w-md">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="ابحث عن طلب..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pr-10"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => setIsFiltersOpen(true)}
              className="relative"
            >
              <Filter className="h-4 w-4 ml-2" />
              فلاتر
              {getActiveFiltersCount() > 0 && (
                <span className="absolute -top-1.5 -left-1.5 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {getActiveFiltersCount()}
                </span>
              )}
            </Button>

            <Button variant="outline" onClick={handleExportCsv}>
              <Download className="h-4 w-4 ml-2" />
              تصدير
            </Button>

            <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
              <Upload className="h-4 w-4 ml-2" />
              استيراد
            </Button>

            <Button variant="outline" onClick={loadOrders} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
          </div>
        </div>
      </Card>

      {isLoading && orders.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-zinc-400 animate-spin mb-4" />
            <p className="text-zinc-500">جاري تحميل الطلبات...</p>
          </div>
        </Card>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-950 mb-2">لا توجد طلبات</h3>
            <p className="text-zinc-600 mb-6">ابدأ باستيراد طلبات من ملف CSV</p>
          </CardContent>
        </Card>
      ) : (
        <OrdersTable
          orders={orders}
          statuses={statuses}
          selectedOrderIds={selectedOrderIds}
          onSelectAll={handleSelectAll}
          onSelectOrder={handleSelectOrder}
          onStatusChange={handleStatusChange}
          onViewDetails={(id) => {
            setSelectedOrderId(id);
            setIsDetailsOpen(true);
          }}
          onDuplicate={handleDuplicateOrder}
          currentPage={currentPage}
          pageSize={pageSize}
          totalCount={totalCount}
          pageCount={pageCount}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          isAdmin={true}
        />
      )}

      {selectedOrderIds.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedOrderIds.length}
          statuses={statuses}
          carriers={carriers}
          employees={employees}
          onUpdateStatus={handleBulkUpdateStatus}
          onAssignCarrier={handleBulkAssignCarrier}
          onAssignEmployee={handleBulkAssignEmployee}
          onExportSelected={handleExportSelected}
          onPrintSelected={handlePrintSelected}
          onClearSelection={() => setSelectedOrderIds([])}
        />
      )}

      <FiltersPanel
        filters={filters}
        onFiltersChange={(newFilters) => {
          setFilters(newFilters);
          setCurrentPage(1);
        }}
        onClear={() => {
          setFilters({});
          setCurrentPage(1);
        }}
        statuses={statuses}
        countries={countries}
        carriers={carriers}
        employees={employees}
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        businessId={currentBusiness.id}
      />

      {selectedOrderId && (
        <OrderDetailsDrawer
          orderId={selectedOrderId}
          businessId={currentBusiness.id}
          statuses={statuses}
          isOpen={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false);
            setSelectedOrderId(null);
          }}
          onUpdate={loadOrders}
          isAdmin={true}
        />
      )}

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportCsv}
        onDownloadTemplate={handleDownloadTemplate}
        templateAvailable={true}
      />
    </>
  );
}
