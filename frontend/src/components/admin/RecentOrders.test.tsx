import { render, screen, fireEvent } from '../../utils/test-utils';
import RecentOrders from './RecentOrders';

const mockOrders = [
  {
    _id: '1',
    orderId: 'ORD-001',
    userId: {
      fullName: 'John Doe',
      email: 'john@example.com'
    },
    status: 'pending' as const,
    finalAmount: 250,
    createdAt: '2023-10-01T10:00:00Z'
  },
  {
    _id: '2',
    orderId: 'ORD-002',
    userId: {
      fullName: 'Jane Smith',
      email: 'jane@example.com'
    },
    status: 'delivered' as const,
    finalAmount: 150,
    createdAt: '2023-10-02T10:00:00Z'
  }
];

const mockHandlers = {
  onViewOrder: jest.fn(),
  onEditOrder: jest.fn()
};

describe('RecentOrders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders orders table correctly', () => {
    render(<RecentOrders orders={mockOrders} {...mockHandlers} />);
    
    expect(screen.getByText('Recent Orders')).toBeInTheDocument();
    expect(screen.getByText('ORD-001')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('ORD-002')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('displays status badges correctly', () => {
    render(<RecentOrders orders={mockOrders} {...mockHandlers} />);
    
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Delivered')).toBeInTheDocument();
  });

  it('formats currency correctly', () => {
    render(<RecentOrders orders={mockOrders} {...mockHandlers} />);
    
    expect(screen.getByText('$250')).toBeInTheDocument();
    expect(screen.getByText('$150')).toBeInTheDocument();
  });

  it('calls view order handler when view button is clicked', () => {
    render(<RecentOrders orders={mockOrders} {...mockHandlers} />);
    
    const viewButtons = screen.getAllByTitle('View Order');
    fireEvent.click(viewButtons[0]);
    
    expect(mockHandlers.onViewOrder).toHaveBeenCalledWith('1');
  });

  it('calls edit order handler when edit button is clicked', () => {
    render(<RecentOrders orders={mockOrders} {...mockHandlers} />);
    
    const editButtons = screen.getAllByTitle('Edit Order');
    fireEvent.click(editButtons[0]);
    
    expect(mockHandlers.onEditOrder).toHaveBeenCalledWith('1');
  });

  it('shows empty state when no orders', () => {
    render(<RecentOrders orders={[]} {...mockHandlers} />);
    
    expect(screen.getByText('No recent orders found')).toBeInTheDocument();
  });
});