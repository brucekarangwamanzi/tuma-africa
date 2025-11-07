import React from 'react';

interface ChartData {
  orders: number[];
  revenue: number[];
}

interface AnalyticsChartProps {
  data: ChartData;
  period: 'week' | 'month' | 'year';
}

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ data, period }) => {
  const labels = {
    week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    month: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    year: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  };

  const currentLabels = labels[period];
  const maxOrders = Math.max(...data.orders);
  const maxRevenue = Math.max(...data.revenue);

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold text-gray-900">Analytics Overview</h3>
        <p className="text-sm text-gray-600">Orders and revenue trends</p>
      </div>
      <div className="card-body">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Orders Chart */}
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-4">Orders</h4>
            <div className="space-y-3">
              {data.orders.map((value, index) => {
                const percentage = (value / maxOrders) * 100;
                return (
                  <div key={index} className="flex items-center">
                    <div className="w-16 text-sm text-gray-600">
                      {currentLabels[index]}
                    </div>
                    <div className="flex-1 mx-3">
                      <div className="bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-12 text-sm font-medium text-gray-900 text-right">
                      {value}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Revenue Chart */}
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-4">Revenue</h4>
            <div className="space-y-3">
              {data.revenue.map((value, index) => {
                const percentage = (value / maxRevenue) * 100;
                return (
                  <div key={index} className="flex items-center">
                    <div className="w-16 text-sm text-gray-600">
                      {currentLabels[index]}
                    </div>
                    <div className="flex-1 mx-3">
                      <div className="bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-green-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-16 text-sm font-medium text-gray-900 text-right">
                      ${value.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {data.orders.reduce((a, b) => a + b, 0)}
              </p>
              <p className="text-sm text-gray-600">Total Orders</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                ${data.revenue.reduce((a, b) => a + b, 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Total Revenue</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsChart;