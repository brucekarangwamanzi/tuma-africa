import { render, screen } from '../../utils/test-utils';
import DashboardStats from './DashboardStats';

const mockStats = {
  totalUsers: 150,
  totalOrders: 89,
  pendingOrders: 12,
  totalRevenue: 45000,
  monthlyGrowth: 15.5
};

describe('DashboardStats', () => {
  it('renders all stat items correctly', () => {
    render(<DashboardStats stats={mockStats} />);
    
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    
    expect(screen.getByText('Total Orders')).toBeInTheDocument();
    expect(screen.getByText('89')).toBeInTheDocument();
    
    expect(screen.getByText('Pending Orders')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('$45,000')).toBeInTheDocument();
  });

  it('displays growth percentages correctly', () => {
    render(<DashboardStats stats={mockStats} />);
    
    expect(screen.getByText('+15.5%')).toBeInTheDocument();
    expect(screen.getAllByText('vs last month')).toHaveLength(4);
  });

  it('formats large numbers with commas', () => {
    const largeStats = {
      ...mockStats,
      totalUsers: 1500,
      totalRevenue: 450000
    };
    
    render(<DashboardStats stats={largeStats} />);
    
    expect(screen.getByText('1,500')).toBeInTheDocument();
    expect(screen.getByText('$450,000')).toBeInTheDocument();
  });
});