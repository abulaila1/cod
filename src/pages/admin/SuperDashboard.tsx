import { useState, useEffect, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Building2,
  Clock,
  Award,
  Package,
  CheckCircle,
  XCircle,
  Edit3,
  Save,
  X,
  Search,
  MoreVertical,
  ShieldOff,
  Shield,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { useSuperAdmin } from '../../contexts/SuperAdminContext';
import {
  BusinessService,
  AdminWorkspace,
  AdminStats,
  WorkspaceStatus
} from '../../services/business.service';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/common/Skeleton';

function StatsCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">{title}</p>
            <p className="text-3xl font-bold text-zinc-900 mt-1">{value.toLocaleString()}</p>
            {subtitle && <p className="text-xs text-zinc-400 mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'pending':
      return <Badge variant="warning">Pending</Badge>;
    case 'verified':
      return <Badge variant="success">Verified</Badge>;
    case 'rejected':
      return <Badge variant="danger">Rejected</Badge>;
    default:
      return <Badge variant="default">None</Badge>;
  }
}

function WorkspaceStatusBadge({ status }: { status: WorkspaceStatus }) {
  if (status === 'suspended') {
    return <Badge variant="danger">Suspended</Badge>;
  }
  return <Badge variant="success">Active</Badge>;
}

function PlanTypeBadge({ planType, isLifetime }: { planType: string; isLifetime: boolean }) {
  if (isLifetime) {
    return <Badge variant="success">Lifetime</Badge>;
  }
  switch (planType) {
    case 'annual':
      return <Badge variant="primary">Annual</Badge>;
    case 'monthly':
      return <Badge variant="default">Monthly</Badge>;
    default:
      return <Badge variant="default">{planType}</Badge>;
  }
}

interface EditingLimit {
  businessId: string;
  value: string;
}

interface ActionsMenuProps {
  workspace: AdminWorkspace;
  onApprove: () => void;
  onReject: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  isLoading: boolean;
}

function ActionsMenu({
  workspace,
  onApprove,
  onReject,
  onToggleStatus,
  onDelete,
  isLoading
}: ActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
      >
        <MoreVertical className="h-4 w-4" />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-zinc-200 py-1 z-20">
            {workspace.manual_payment_status === 'pending' && (
              <>
                <button
                  onClick={() => { onApprove(); setIsOpen(false); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-50 flex items-center gap-2 text-emerald-600"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve Payment
                </button>
                <button
                  onClick={() => { onReject(); setIsOpen(false); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-50 flex items-center gap-2 text-amber-600"
                >
                  <XCircle className="h-4 w-4" />
                  Reject Payment
                </button>
                <div className="border-t border-zinc-100 my-1" />
              </>
            )}

            {!workspace.is_lifetime_deal && workspace.manual_payment_status !== 'pending' && (
              <>
                <button
                  onClick={() => { onApprove(); setIsOpen(false); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-50 flex items-center gap-2 text-emerald-600"
                >
                  <Award className="h-4 w-4" />
                  Grant Lifetime Deal
                </button>
                <div className="border-t border-zinc-100 my-1" />
              </>
            )}

            <button
              onClick={() => { onToggleStatus(); setIsOpen(false); }}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-zinc-50 flex items-center gap-2 ${
                workspace.status === 'suspended' ? 'text-emerald-600' : 'text-amber-600'
              }`}
            >
              {workspace.status === 'suspended' ? (
                <>
                  <Shield className="h-4 w-4" />
                  Unsuspend Account
                </>
              ) : (
                <>
                  <ShieldOff className="h-4 w-4" />
                  Suspend Account
                </>
              )}
            </button>

            <div className="border-t border-zinc-100 my-1" />

            <button
              onClick={() => { onDelete(); setIsOpen(false); }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"
            >
              <Trash2 className="h-4 w-4" />
              Delete Workspace
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function DeleteConfirmModal({
  workspace,
  onConfirm,
  onCancel,
  isLoading
}: {
  workspace: AdminWorkspace;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-6 h-6 text-red-600" />
        </div>

        <h3 className="text-lg font-bold text-zinc-900 text-center mb-2">
          Delete Workspace
        </h3>

        <p className="text-zinc-600 text-center mb-2">
          Are you sure you want to delete <strong>{workspace.name}</strong>?
        </p>

        <p className="text-sm text-red-600 text-center mb-6 bg-red-50 px-4 py-2 rounded-lg">
          This action is irreversible. All data associated with this workspace will be permanently deleted.
        </p>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1 bg-red-600 hover:bg-red-700"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SuperDashboard() {
  const { isSuperAdmin, loading: adminLoading } = useSuperAdmin();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [workspaces, setWorkspaces] = useState<AdminWorkspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingLimit, setEditingLimit] = useState<EditingLimit | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteWorkspace, setDeleteWorkspace] = useState<AdminWorkspace | null>(null);

  useEffect(() => {
    if (isSuperAdmin) {
      loadData();
    }
  }, [isSuperAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, workspacesData] = await Promise.all([
        BusinessService.getAdminStats(),
        BusinessService.getAllWorkspacesForAdmin(),
      ]);
      setStats(statsData);
      setWorkspaces(workspacesData);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkspaces = useMemo(() => {
    if (!searchQuery.trim()) return workspaces;

    const query = searchQuery.toLowerCase();
    return workspaces.filter(w =>
      w.name.toLowerCase().includes(query) ||
      (w.owner_email && w.owner_email.toLowerCase().includes(query)) ||
      w.slug?.toLowerCase().includes(query)
    );
  }, [workspaces, searchQuery]);

  const handleApprove = async (businessId: string) => {
    setActionLoading(businessId);
    try {
      await BusinessService.approveLifetimeDeal(businessId);
      await loadData();
    } catch (error) {
      console.error('Failed to approve:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (businessId: string) => {
    setActionLoading(businessId);
    try {
      await BusinessService.rejectPayment(businessId);
      await loadData();
    } catch (error) {
      console.error('Failed to reject:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (workspace: AdminWorkspace) => {
    setActionLoading(workspace.id);
    try {
      const newStatus: WorkspaceStatus = workspace.status === 'suspended' ? 'active' : 'suspended';
      await BusinessService.toggleWorkspaceStatus(workspace.id, newStatus);
      await loadData();
    } catch (error) {
      console.error('Failed to toggle status:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (businessId: string) => {
    setActionLoading(businessId);
    try {
      await BusinessService.deleteWorkspaceAsAdmin(businessId);
      setDeleteWorkspace(null);
      await loadData();
    } catch (error) {
      console.error('Failed to delete:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveLimit = async () => {
    if (!editingLimit) return;
    setActionLoading(editingLimit.businessId);
    try {
      const limit = editingLimit.value === '' ? null : parseInt(editingLimit.value, 10);
      await BusinessService.updateWorkspaceLimit(editingLimit.businessId, limit);
      setEditingLimit(null);
      await loadData();
    } catch (error) {
      console.error('Failed to update limit:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (adminLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  const suspendedCount = workspaces.filter(w => w.status === 'suspended').length;

  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <h1 className="text-2xl font-bold">Control Center</h1>
              </div>
              <p className="text-zinc-400">Super Admin Dashboard - Manage workspaces, payments, and lifetime deals</p>
            </div>
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={loadData}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Workspaces"
              value={stats.total_workspaces}
              icon={Building2}
              color="bg-blue-500"
              subtitle={`${suspendedCount} suspended`}
            />
            <StatsCard
              title="Pending Payments"
              value={stats.pending_payments}
              icon={Clock}
              color="bg-amber-500"
              subtitle="Awaiting review"
            />
            <StatsCard
              title="Lifetime Deals"
              value={stats.active_lifetime_deals}
              icon={Award}
              color="bg-emerald-500"
              subtitle="Active accounts"
            />
            <StatsCard
              title="Total Orders"
              value={stats.total_orders}
              icon={Package}
              color="bg-zinc-700"
              subtitle="Platform-wide"
            />
          </div>
        )}

        <Card className="shadow-lg">
          <CardHeader className="border-b border-zinc-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-lg font-bold text-zinc-900">All Workspaces</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-80"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6">
                <Skeleton className="h-64" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        Business
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        Owner Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        Payment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        Max Orders
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {filteredWorkspaces.map((workspace) => (
                      <tr
                        key={workspace.id}
                        className={`hover:bg-zinc-50 transition-colors ${
                          workspace.status === 'suspended' ? 'bg-red-50/50' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-zinc-900">{workspace.name}</p>
                            <p className="text-xs text-zinc-500">
                              {new Date(workspace.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-zinc-600">
                            {workspace.owner_email || '-'}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <WorkspaceStatusBadge status={workspace.status} />
                        </td>
                        <td className="px-6 py-4">
                          <PlanTypeBadge
                            planType={workspace.plan_type}
                            isLifetime={workspace.is_lifetime_deal}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <PaymentStatusBadge status={workspace.manual_payment_status} />
                        </td>
                        <td className="px-6 py-4">
                          {editingLimit?.businessId === workspace.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={editingLimit.value}
                                onChange={(e) => setEditingLimit({ ...editingLimit, value: e.target.value })}
                                className="w-24 text-sm"
                                placeholder="Unlimited"
                              />
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={handleSaveLimit}
                                disabled={actionLoading === workspace.id}
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingLimit(null)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-zinc-600">
                                {workspace.max_orders_limit !== null
                                  ? workspace.max_orders_limit.toLocaleString()
                                  : 'Unlimited'}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingLimit({
                                  businessId: workspace.id,
                                  value: workspace.max_orders_limit?.toString() || '',
                                })}
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end">
                            <ActionsMenu
                              workspace={workspace}
                              onApprove={() => handleApprove(workspace.id)}
                              onReject={() => handleReject(workspace.id)}
                              onToggleStatus={() => handleToggleStatus(workspace)}
                              onDelete={() => setDeleteWorkspace(workspace)}
                              isLoading={actionLoading === workspace.id}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredWorkspaces.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                          {searchQuery ? 'No workspaces match your search' : 'No workspaces found'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-4 text-center text-xs text-zinc-500">
          Showing {filteredWorkspaces.length} of {workspaces.length} workspaces
        </div>
      </div>

      {deleteWorkspace && (
        <DeleteConfirmModal
          workspace={deleteWorkspace}
          onConfirm={() => handleDelete(deleteWorkspace.id)}
          onCancel={() => setDeleteWorkspace(null)}
          isLoading={actionLoading === deleteWorkspace.id}
        />
      )}
    </div>
  );
}
