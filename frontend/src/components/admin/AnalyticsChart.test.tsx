import { render, screen } from '../../utils/test-utils';
import AnalyticsChart from './AnalyticsChart';

const mockChartData = {
  orders: [10, 15, 12, 18, 22, 25, 30],
  revenue: [1000, 1500, 1200, 1800, 2200, 2500, 3000]
};

describe('AnalyticsChart', () => {
  it('renders analytics chart with data', () => {
    render(<AnalyticsChart data={mockChartData} period="week" />);
    
    expect(screen.getByText('Analytics Overview')).toBeInTheDocument();
    expect(screen.getByText('Orders and revenue trends')).toBeInTheDocument();
    expect(screen.getByText('Orders')).toBeInTheDocument();
    expect(screen.getByText('Revenue')).toBeInTheDocument();
  });

  it('displays correct totals', () => {
    render(<AnalyticsChart data={mockChartData} period="week" />);
    
    // Total orders: 10+15+12+18+22+25+30 = 132
    expect(screen.getByText('132')).toBeInTheDocument();
    
    // Total revenue: 1000+1500+1200+1800+2200+2500+3000 = 13200
    expect(screen.getByText('$13,200')).toBeInTheDocument();
  });

  it('renders week labels correctly', () => {
    render(<AnalyticsChart data={mockChartData} period="week" />);
    
    expect(screen.getAllByText('Mon')).toHaveLength(2); // Orders and Revenue sections
    expect(screen.getAllByText('Tue')).toHaveLength(2);
    expect(screen.getAllByText('Wed')).toHaveLength(2);
    expect(screen.getAllByText('Thu')).toHaveLength(2);
    expect(screen.getAllByText('Fri')).toHaveLength(2);
    expect(screen.getAllByText('Sat')).toHaveLength(2);
    expect(screen.getAllByText('Sun')).toHaveLength(2);
  });

  it('renders month labels correctly', () => {
    const monthData = {
      orders: [25, 30, 28, 35],
      revenue: [5000, 6000, 5500, 7000]
    };
    
    render(<AnalyticsChart data={monthData} period="month" />);
    
    expect(screen.getAllByText('Week 1')).toHaveLength(2); // Orders and Revenue sections
    expect(screen.getAllByText('Week 2')).toHaveLength(2);
    expect(screen.getAllByText('Week 3')).toHaveLength(2);
    expect(screen.getAllByText('Week 4')).toHaveLength(2);
  });

  it('handles empty data gracefully', () => {
    const emptyData = {
      orders: [],
      revenue: []
    };
    
    render(<AnalyticsChart data={emptyData} period="week" />);
    
    expect(screen.getByText('Analytics Overview')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument(); // Total orders
    expect(screen.getByText('$0')).toBeInTheDocument(); // Total revenue
  });
});