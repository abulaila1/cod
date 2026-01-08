import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, Button, Input, Modal } from '@/components/ui';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAuth } from '@/contexts/AuthContext';
import { MembershipService, InvitationService } from '@/services';
import type { BusinessMember, Invitation, MemberRole } from '@/types/business';
import { Copy, UserPlus, Trash2, Shield } from 'lucide-react';

export function Workspace() {
  const { currentBusiness } = useBusiness();
  const { user } = useAuth();
  const [members, setMembers] = useState<BusinessMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<MemberRole>('agent');
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');

  useEffect(() => {
    if (currentBusiness) {
      loadData();
    }
  }, [currentBusiness]);

  const loadData = async () => {
    if (!currentBusiness) return;

    try {
      setIsLoading(true);
      const [membersData, invitationsData] = await Promise.all([
        MembershipService.getBusinessMembers(currentBusiness.id),
        InvitationService.getBusinessInvitations(currentBusiness.id),
      ]);
      setMembers(membersData);
      setInvitations(invitationsData);
    } catch (error) {
      console.error('Failed to load workspace data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInvitation = async () => {
    if (!currentBusiness || !user || !inviteEmail) return;

    try {
      const invitation = await InvitationService.createInvitation(
        {
          business_id: currentBusiness.id,
          email: inviteEmail,
          role: inviteRole,
        },
        user.id
      );

      const inviteLink = InvitationService.getInviteUrl(invitation.token);
      setGeneratedInviteLink(inviteLink);
      setInviteEmail('');
      loadData();
    } catch (error) {
      console.error('Failed to create invitation:', error);
      alert('فشل إنشاء الدعوة');
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(generatedInviteLink);
    alert('تم نسخ الرابط');
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('هل أنت متأكد من إزالة هذا العضو؟')) return;

    try {
      await MembershipService.removeMember(memberId);
      loadData();
    } catch (error) {
      console.error('Failed to remove member:', error);
      alert('فشل إزالة العضو');
    }
  };

  const handleDeleteInvitation = async (invitationId: string) => {
    try {
      await InvitationService.deleteInvitation(invitationId);
      loadData();
    } catch (error) {
      console.error('Failed to delete invitation:', error);
    }
  };

  const getRoleLabel = (role: MemberRole) => {
    const labels = {
      admin: 'مدير',
      manager: 'مشرف',
      agent: 'موظف',
      viewer: 'مشاهد',
    };
    return labels[role];
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
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <h3 className="text-xl font-bold text-zinc-950">معلومات الوورك سبيس</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-900 mb-2">
                  اسم الوورك سبيس
                </label>
                <Input value={currentBusiness.name} disabled />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-zinc-950">الأعضاء ({members.length})</h3>
            <Button
              variant="accent"
              size="sm"
              onClick={() => setShowInviteModal(true)}
            >
              <UserPlus className="h-4 w-4" />
              دعوة عضو
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-zinc-600 text-center py-8">جاري التحميل...</p>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        {member.user_email?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-zinc-950">{member.user_name}</p>
                        <p className="text-sm text-zinc-600">{member.user_email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1 bg-white rounded-lg text-sm text-zinc-700 font-medium">
                        <Shield className="h-3 w-3 inline ml-1" />
                        {getRoleLabel(member.role)}
                      </div>
                      {member.user_id !== user?.id && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-smooth"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-xl font-bold text-zinc-950">الدعوات المعلقة ({invitations.length})</h3>
          </CardHeader>
          <CardContent>
            {invitations.length === 0 ? (
              <p className="text-zinc-600 text-center py-8">لا توجد دعوات معلقة</p>
            ) : (
              <div className="space-y-3">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl"
                  >
                    <div>
                      <p className="font-medium text-zinc-950">{invitation.email}</p>
                      <p className="text-sm text-zinc-600">
                        {getRoleLabel(invitation.role)} • تنتهي في {new Date(invitation.expires_at).toLocaleDateString('ar')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteInvitation(invitation.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-smooth"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showInviteModal && (
        <Modal
          isOpen={showInviteModal}
          onClose={() => {
            setShowInviteModal(false);
            setGeneratedInviteLink('');
          }}
          title="دعوة عضو جديد"
        >
          <div className="space-y-6">
            {!generatedInviteLink ? (
              <>
                <Input
                  label="البريد الإلكتروني"
                  type="email"
                  placeholder="user@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <div>
                  <label className="block text-sm font-medium text-zinc-900 mb-2">
                    الصلاحية
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as MemberRole)}
                    className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:border-emerald-500 focus-ring transition-smooth"
                  >
                    <option value="admin">مدير</option>
                    <option value="manager">مشرف</option>
                    <option value="agent">موظف</option>
                    <option value="viewer">مشاهد</option>
                  </select>
                </div>
                <Button
                  variant="accent"
                  className="w-full"
                  onClick={handleCreateInvitation}
                  disabled={!inviteEmail}
                >
                  إنشاء دعوة
                </Button>
              </>
            ) : (
              <>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <p className="text-sm text-emerald-800 mb-3">تم إنشاء الدعوة بنجاح! انسخ الرابط وأرسله للشخص المدعو:</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={generatedInviteLink}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white border border-emerald-300 rounded-lg text-sm"
                    />
                    <Button variant="outline" size="sm" onClick={copyInviteLink}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => {
                    setShowInviteModal(false);
                    setGeneratedInviteLink('');
                  }}
                >
                  إغلاق
                </Button>
              </>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
