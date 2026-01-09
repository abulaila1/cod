import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface StatusData {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

interface StatusDonutProps {
  data: StatusData[];
  totalOrders: number;
}

export function StatusDonut({ data, totalOrders }: StatusDonutProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;

    const item = payload[0].payload;
    const percentage = totalOrders > 0 ? ((item.value / totalOrders) * 100).toFixed(1) : 0;

    return (
      <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-gray-100">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-sm font-medium text-gray-700">{item.name}</span>
        </div>
        <div className="mt-1 text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{item.value}</span> طلب ({percentage}%)
        </div>
      </div>
    );
  };

  if (!data.length || totalOrders === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="relative w-40 h-40">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="12"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gray-300">0</span>
            <span className="text-xs text-gray-400">طلب</span>
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-400">لا توجد طلبات</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  className="transition-all duration-300 hover:opacity-80"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold text-gray-800">{totalOrders}</span>
          <span className="text-xs text-gray-500">طلب</span>
        </div>
      </div>

      <div className="mt-4 w-full space-y-2">
        {data.slice(0, 5).map((item, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-gray-600 truncate max-w-[120px]">{item.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{item.value}</span>
              <span className="text-gray-400 text-xs">
                ({totalOrders > 0 ? ((item.value / totalOrders) * 100).toFixed(0) : 0}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
