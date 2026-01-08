import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PublicLayout } from '@/components/layout';
import { Button, Card, CardContent } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { InvitationService } from '@/services';
import type { Invitation } from '@/types/business';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export function InviteAcceptance() {
  const { token } = useParams<{ token: string }>();
  const { user } = useAuth();
  const { refreshBusinesses, switchBusiness } = useBusiness();
  const navigate = useNavigate();

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAccepting, setIsAccepting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      loadInvitation();
    }
  }, [token]);

  const loadInvitation = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      const inviteData = await InvitationService.getInvitationByToken(token);

      if (!inviteData) {
        setError('دعوة غير موجودة');
        return;
      }

      if (inviteData.accepted_at) {
        setError('تم قبول هذه الدعوة مسبقاً');
        return;
      }

      if (new Date(inviteData.expires_at) < new Date()) {
        setError('انتهت صلاحية هذه الدعوة');
        return;
      }

      setInvitation(inviteData);
    } catch (err) {
      setError('فشل تحميل الدعوة');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!token || !user) {
      navigate(`/auth/login?redirect=/invite/${token}`);
      return;
    }

    try {
      setIsAccepting(true);
      await InvitationService.acceptInvitation(token, user.id);
      await refreshBusinesses();

      if (invitation) {
        switchBusiness(invitation.business_id);
      }

      setSuccess(true);

      setTimeout(() => {
        navigate('/app/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'فشل قبول الدعوة');
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex items-center justify-center px-4">
          <Card className="w-full max-w-md">
            <CardContent className="py-12 text-center">
              <Loader2 className="h-12 w-12 text-emerald-600 animate-spin mx-auto mb-4" />
              <p className="text-zinc-600">جاري تحميل الدعوة...</p>
            </CardContent>
          </Card>
        </div>
      </PublicLayout>
    );
  }

  if (error || !invitation) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex items-center justify-center px-4">
          <Card className="w-full max-w-md">
            <CardContent className="py-12 text-center">
              <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-zinc-950 mb-2">خطأ</h2>
              <p className="text-zinc-600 mb-6">{error}</p>
              <Link to="/">
                <Button variant="primary">العودة للرئيسية</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </PublicLayout>
    );
  }

  if (success) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex items-center justify-center px-4">
          <Card className="w-full max-w-md">
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-zinc-950 mb-2">تم قبول الدعوة!</h2>
              <p className="text-zinc-600 mb-4">سيتم تحويلك إلى لوحة التحكم...</p>
            </CardContent>
          </Card>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-emerald-700">
                  {invitation.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-zinc-950 mb-2">دعوة للانضمام</h2>
              <p className="text-zinc-600">
                تمت دعوتك للانضمام إلى الوورك سبيس
              </p>
            </div>

            <div className="bg-zinc-50 rounded-xl p-4 mb-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600">البريد الإلكتروني:</span>
                  <span className="text-zinc-950 font-medium">{invitation.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600">الصلاحية:</span>
                  <span className="text-zinc-950 font-medium">
                    {invitation.role === 'admin' && 'مدير'}
                    {invitation.role === 'manager' && 'مشرف'}
                    {invitation.role === 'agent' && 'موظف'}
                    {invitation.role === 'viewer' && 'مشاهد'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600">تنتهي في:</span>
                  <span className="text-zinc-950 font-medium">
                    {new Date(invitation.expires_at).toLocaleDateString('ar')}
                  </span>
                </div>
              </div>
            </div>

            {!user ? (
              <div className="space-y-3">
                <p className="text-sm text-zinc-600 text-center mb-4">
                  يجب تسجيل الدخول أو إنشاء حساب لقبول الدعوة
                </p>
                <Button
                  variant="accent"
                  className="w-full"
                  onClick={() => navigate(`/auth/login?redirect=/invite/${token}`)}
                >
                  تسجيل الدخول
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/auth/register?redirect=/invite/${token}`)}
                >
                  إنشاء حساب جديد
                </Button>
              </div>
            ) : (
              <Button
                variant="accent"
                className="w-full"
                onClick={handleAccept}
                loading={isAccepting}
                disabled={isAccepting}
              >
                قبول الدعوة والانضمام
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}
