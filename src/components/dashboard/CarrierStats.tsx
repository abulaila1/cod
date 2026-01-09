import { Truck } from 'lucide-react';
import type { CarrierStat } from '@/services/analytics.service';

interface CarrierStatsProps {
  carriers: CarrierStat[];
}

export function CarrierStats({ carriers }: CarrierStatsProps) {
  if (!carriers.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <Truck className="w-12 h-12 mb-3 opacity-50" />
        <p className="text-sm">لا توجد شحنات في هذه الفترة</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {carriers.slice(0, 5).map((carrier, index) => {
        const isGoodRate = carrier.deliveryRate >= 70;
        const isMediumRate = carrier.deliveryRate >= 40 && carrier.deliveryRate < 70;

        return (
          <div
            key={carrier.id}
            className="p-3 rounded-xl bg-gray-50/80 hover:bg-gray-100/80 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 flex items-center justify-center text-xs font-bold text-gray-500 bg-gray-200 rounded-lg">
                  {index + 1}
                </span>
                <span className="text-sm font-medium text-gray-800">{carrier.name}</span>
              </div>
              <span className="text-sm font-semibold text-gray-700">
                {carrier.totalOrders} طلب
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isGoodRate
                      ? 'bg-emerald-500'
                      : isMediumRate
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${carrier.deliveryRate}%` }}
                />
              </div>
              <span
                className={`text-sm font-semibold min-w-[45px] text-left ${
                  isGoodRate
                    ? 'text-emerald-600'
                    : isMediumRate
                    ? 'text-amber-600'
                    : 'text-red-600'
                }`}
              >
                {carrier.deliveryRate.toFixed(0)}%
              </span>
            </div>

            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
              <span>تم التوصيل: {carrier.deliveredOrders}</span>
              <span>معلق: {carrier.totalOrders - carrier.deliveredOrders}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
