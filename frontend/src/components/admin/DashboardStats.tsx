import React from 'react';
import { Users, ShoppingCart, Clock, DollarSign, TrendingUp } from 'lucide-react';

interface DashboardStatsProps {
  stats: {
    totalUsers: number;
    totalOrders: number;
    pendingOrders: number;
    totalRevenue: number;
    monthlyGrowth: number;
  };
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  // Return loading state if stats is not available
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card animate-pulse">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      title: 'Total Users',
      value: (stats.totalUsers || 0).toLocaleString(),
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Total Orders',
      value: (stats.totalOrders || 0).toLocaleString(),
      icon: ShoppingCart,
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      title: 'Pending Orders',
      value: (stats.pendingOrders || 0).toLocaleString(),
      icon: Clock,
      color: 'bg-yellow-500',
      change: '-5%'
    },
    {
      title: 'Total Revenue',
      value: `$${(stats.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-purple-500',
      change: `+${stats.monthlyGrowth || 0}%`
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statItems.map((item, index) => {
        const Icon = item.icon;
        const isPositive = item.change.startsWith('+');
        
        return (
          <div key={index} className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {item.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {item.value}
                  </p>
                  <div className="flex items-center mt-2">
                    <TrendingUp 
                      className={`w-4 h-4 mr-1 ${
                        isPositive ? 'text-green-500' : 'text-red-500'
                      }`} 
                    />
                    <span 
                      className={`text-sm font-medium ${
                        isPositive ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {item.change}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">
                      vs last month
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-full ${item.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardStats;