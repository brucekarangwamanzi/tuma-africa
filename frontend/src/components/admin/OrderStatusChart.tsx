import React from 'react';

interface OrderStatusChartProps {
  stats: {
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    total: number;
  };
}

const OrderStatusChart: React.FC<OrderStatusChartProps> = ({ stats }) => {
  const data = [
    { label: 'Pending', value: stats.pending, color: '#F59E0B', bgColor: '#FEF3C7' },
    { label: 'Processing', value: stats.processing, color: '#3B82F6', bgColor: '#DBEAFE' },
    { label: 'Shipped', value: stats.shipped, color: '#8B5CF6', bgColor: '#EDE9FE' },
    { label: 'Delivered', value: stats.delivered, color: '#10B981', bgColor: '#D1FAE5' },
    { label: 'Cancelled', value: stats.cancelled, color: '#EF4444', bgColor: '#FEE2E2' }
  ];

  const total = stats.total || 1; // Prevent division by zero

  return (
    <div className="space-y-4">
      {/* Simple Bar Chart */}
      <div className="space-y-3">
        {data.map((item) => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0;
          
          return (
            <div key={item.label} className="flex items-center space-x-3">
              <div className="w-20 text-sm font-medium text-gray-700 text-right">
                {item.label}
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-3 relative overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: item.color
                  }}
                />
              </div>
              <div className="w-12 text-sm font-semibold text-gray-900 text-right">
                {item.value}
              </div>
              <div className="w-12 text-xs text-gray-500 text-right">
                {percentage.toFixed(0)}%
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 pt-4 border-t border-gray-200">
        {data.map((item) => (
          <div key={item.label} className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-gray-600">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="pt-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-600">Total Orders</p>
        </div>
      </div>
    </div>
  );
};

export default OrderStatusChart;