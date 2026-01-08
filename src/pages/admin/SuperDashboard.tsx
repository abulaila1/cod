import { useState, useEffect } from 'react';
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
  X
} from 'lucide-react';
import { useSuperAdmin } from '../../contexts/SuperAdminContext';
import { BusinessService, AdminWorkspace, AdminStats } from '../../services/business.service';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/common/Skeleton';

function StatsCard({
  title,
  value,
  icon: Icon,
  color
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">{title}</p>
            <p className="text-3xl font-bold text-zinc-900 mt-1">{value.toLocaleString()}</p>
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

export default function SuperDashboard() {
  const { isSuperAdmin, loading: adminLoading } = useSuperAdmin();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [workspaces, setWorkspaces] = useState<AdminWorkspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingLimit, setEditingLimit] = useState<EditingLimit | null>(null);

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

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
          <p className="text-zinc-400 mt-1">Manage workspaces, lifetime deals, and payments</p>
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
            />
            <StatsCard
              title="Pending Payments"
              value={stats.pending_payments}
              icon={Clock}
              color="bg-amber-500"
            />
            <StatsCard
              title="Active Lifetime Deals"
              value={stats.active_lifetime_deals}
              icon={Award}
              color="bg-emerald-500"
            />
            <StatsCard
              title="Total Orders"
              value={stats.total_orders}
              icon={Package}
              color="bg-zinc-700"
            />
          </div>
        )}

        <Card>
          <CardHeader>
            <h2 className="text-lg font-bold text-zinc-900">All Workspaces</h2>
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
                        Business Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        Plan Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        Payment Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        Max Orders
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        Billing Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {workspaces.map((workspace) => (
                      <tr key={workspace.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-zinc-900">{workspace.name}</p>
                            <p className="text-xs text-zinc-500">{workspace.slug || workspace.id.slice(0, 8)}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-600">
                          {new Date(workspace.created_at).toLocaleDateString()}
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
                          <Badge variant={workspace.billing?.status === 'active' ? 'success' : 'default'}>
                            {workspace.billing?.status || 'N/A'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {workspace.manual_payment_status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => handleApprove(workspace.id)}
                                  disabled={actionLoading === workspace.id}
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReject(workspace.id)}
                                  disabled={actionLoading === workspace.id}
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {workspace.manual_payment_status === 'none' && !workspace.is_lifetime_deal && (
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleApprove(workspace.id)}
                                disabled={actionLoading === workspace.id}
                              >
                                <Award className="h-4 w-4 mr-1" />
                                Grant Lifetime
                              </Button>
                            )}
                            {workspace.is_lifetime_deal && (
                              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Lifetime Active
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {workspaces.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                          No workspaces found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
