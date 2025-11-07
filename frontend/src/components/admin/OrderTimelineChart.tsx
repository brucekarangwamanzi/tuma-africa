import React from 'react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface Order {
  _id: string;
  createdAt: string;
  finalAmount?: number;
  status: string;
}

interface OrderTimelineChartProps {
  orders: Order[];
}

const OrderTimelineChart: React.FC<OrderTimelineChartProps> = ({ orders }) => {
  // Generate last 7 days data
  const generateTimelineData = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= dayStart && orderDate <= dayEnd;
      });
      
      const dayRevenue = dayOrders.reduce((sum, order) => sum + (order.finalAmount || 0), 0);
      
      days.push({
        date: format(date, 'MMM dd'),
        shortDate: format(date, 'dd'),
        orders: dayOrders.length,
        revenue: dayRevenue
      });
    }
    
    return days;
  };

  const timelineData = generateTimelineData();
  const maxOrders = Math.max(...timelineData.map(d => d.orders), 1);
  const maxRevenue = Math.max(...timelineData.map(d => d.revenue), 1);

  return (
    <div className="space-y-6">
      {/* Orders Chart */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Daily Orders</h4>
        <div className="flex items-end justify-between space-x-2 h-32">
          {timelineData.map((day, index) => {
            const height = maxOrders > 0 ? (day.orders / maxOrders) * 100 : 0;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full flex justify-center mb-2">
                  <div
                    className="bg-blue-500 rounded-t-sm transition-all duration-500 ease-out min-h-[4px] w-8"
                    style={{ height: `${Math.max(height, 4)}%` }}
                    title={`${day.orders} orders on ${day.date}`}
                  />
                </div>
                <div className="text-xs text-gray-600 text-center">
                  <div className="font-medium">{day.orders}</div>
                  <div className="text-gray-400">{day.shortDate}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Revenue Chart */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Daily Revenue</h4>
        <div className="flex items-end justify-between space-x-2 h-32">
          {timelineData.map((day, index) => {
            const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full flex justify-center mb-2">
                  <div
                    className="bg-green-500 rounded-t-sm transition-all duration-500 ease-out min-h-[4px] w-8"
                    style={{ height: `${Math.max(height, 4)}%` }}
                    title={`$${day.revenue.toLocaleString()} revenue on ${day.date}`}
                  />
                </div>
                <div className="text-xs text-gray-600 text-center">
                  <div className="font-medium">${day.revenue.toLocaleString()}</div>
                  <div className="text-gray-400">{day.shortDate}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-lg font-bold text-blue-600">
            {timelineData.reduce((sum, day) => sum + day.orders, 0)}
          </p>
          <p className="text-xs text-gray-600">Orders (7 days)</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-green-600">
            ${timelineData.reduce((sum, day) => sum + day.revenue, 0).toLocaleString()}
          </p>
          <p className="text-xs text-gray-600">Revenue (7 days)</p>
        </div>
      </div>
    </div>
  );
};

export default OrderTimelineChart;