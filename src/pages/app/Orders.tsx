import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button, Card, CardContent } from '@/components/ui';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAuth } from '@/contexts/AuthContext';
import { OrdersService } from '@/services/orders.service';
import { useOrdersList } from '@/hooks/useOrdersList';
import { OrdersToolbar } from '@/components/orders/OrdersToolbar';
import { OrdersTable } from '@/components/orders/OrdersTable';
import { FiltersPanel } from '@/components/orders/FiltersPanel';
import { BulkActionsBar } from '@/components/orders/BulkActionsBar';
import { OrderDetailsDrawer } from '@/components/orders/OrderDetailsDrawer';
import { ImportModal } from '@/components/entity/ImportModal';
import type { OrderFilters } from '@/types/domain';
import { FileText, X } from 'lucide-react';
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
    } catch (error: any) {
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

  const handleStatusChange = async (orderId: string, statusId: string) => {
    if (!currentBusiness || !user) return;

    try {
      await OrdersService.updateOrderStatus(currentBusiness.id, orderId, statusId, user.id);
      loadOrders();
    } catch (error) {
      console.error('Failed to update status:', error);
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

  const clearAppliedFilters = () => {
    setFilters({});
    setHasAppliedFilters(false);
    setSearchParams({});
  };

  if (!currentBusiness) {
    return (
      <>
        <div className="text-center py-12">
          <p className="text-zinc-600">لم يتم تحديد وورك سبيس</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="الطلبات"
        description="إدارة ومتابعة جميع الطلبات"
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

      <OrdersToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onFiltersClick={() => setIsFiltersOpen(true)}
        onExportCsv={handleExportCsv}
        onImportCsv={() => setIsImportModalOpen(true)}
      />

      {isLoading ? (
        <Card>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-zinc-100 animate-pulse rounded-lg" />
              ))}
            </div>
          </CardContent>
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
          currentPage={currentPage}
          pageSize={pageSize}
          totalCount={totalCount}
          pageCount={pageCount}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      )}

      {selectedOrderIds.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedOrderIds.length}
          statuses={statuses}
          onUpdateStatus={handleBulkUpdateStatus}
          onClearSelection={() => setSelectedOrderIds([])}
        />
      )}

      <FiltersPanel
        filters={filters}
        onFiltersChange={setFilters}
        onClear={() => setFilters({})}
        statuses={statuses}
        countries={countries}
        carriers={carriers}
        employees={employees}
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
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
