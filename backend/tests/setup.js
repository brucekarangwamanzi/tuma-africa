// Mock setup for testing without actual database
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue({}),
  disconnect: jest.fn().mockResolvedValue({}),
  connection: {
    collections: {}
  },
  Schema: {
    Types: {
      ObjectId: jest.fn()
    }
  },
  model: jest.fn()
}));

// Mock JWT for testing
process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';