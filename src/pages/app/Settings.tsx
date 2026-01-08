import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, Button } from '@/components/ui';
import {
  Package,
  Globe,
  Truck,
  Users,
  CheckCircle,
  Briefcase,
  CreditCard,
} from 'lucide-react';

interface SettingCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  path: string;
  iconColor: string;
  iconBg: string;
}

function SettingCard({ icon: Icon, title, description, path, iconColor, iconBg }: SettingCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent>
        <div className="flex items-start gap-4">
          <div className={`${iconBg} p-3 rounded-lg flex-shrink-0`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-zinc-950 mb-1">{title}</h3>
            <p className="text-sm text-zinc-600 mb-4">{description}</p>
            <Button variant="outline" size="sm" onClick={() => navigate(path)}>
              إدارة
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function Settings() {
  return (
    <AppLayout pageTitle="الإعدادات">
      <PageHeader title="الإعدادات" description="إدارة إعدادات المنصة والبيانات الأساسية" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SettingCard
          icon={CreditCard}
          title="الفوترة والخطة"
          description="إدارة الاشتراك والخطة ومراقبة الاستخدام"
          path="/app/billing"
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />

        <SettingCard
          icon={CheckCircle}
          title="حالات الطلب"
          description="إدارة حالات الطلب وتدفق العمليات"
          path="/app/statuses"
          iconColor="text-teal-600"
          iconBg="bg-teal-50"
        />

        <SettingCard
          icon={Package}
          title="المنتجات"
          description="إدارة المنتجات والتكاليف الأساسية"
          path="/app/settings/products"
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />

        <SettingCard
          icon={Globe}
          title="الدول والمناطق"
          description="إدارة الدول والمناطق الجغرافية"
          path="/app/settings/countries"
          iconColor="text-green-600"
          iconBg="bg-green-50"
        />

        <SettingCard
          icon={Truck}
          title="شركات الشحن"
          description="إدارة شركات الشحن والتوصيل"
          path="/app/settings/carriers"
          iconColor="text-orange-600"
          iconBg="bg-orange-50"
        />

        <SettingCard
          icon={Users}
          title="الموظفين"
          description="إدارة الموظفين والمسؤولين عن الطلبات"
          path="/app/settings/employees"
          iconColor="text-cyan-600"
          iconBg="bg-cyan-50"
        />

        <SettingCard
          icon={Briefcase}
          title="الوورك سبيس"
          description="إدارة الأعضاء والدعوات"
          path="/app/workspace"
          iconColor="text-zinc-600"
          iconBg="bg-zinc-50"
        />
      </div>
    </AppLayout>
  );
}
