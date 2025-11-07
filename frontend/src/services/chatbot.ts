interface ChatbotResponse {
  message: string;
  suggestions?: string[];
  requiresHuman?: boolean;
}

class ChatbotService {
  private knowledgeBase: Record<string, ChatbotResponse> = {
    // Greetings
    'hello': {
      message: 'Hello! 👋 Welcome to Tuma-Africa Link Cargo support. How can I help you today?',
      suggestions: ['Track my order', 'Place new order', 'Shipping rates', 'Talk to human']
    },
    'hi': {
      message: 'Hi there! 👋 I\'m here to help. What can I do for you?',
      suggestions: ['Track my order', 'Place new order', 'Shipping rates', 'Talk to human']
    },

    // Order tracking
    'track': {
      message: 'I can help you track your order! 📦 Please provide your order ID (e.g., TMA-12345) and I\'ll look it up for you.',
      requiresHuman: false
    },
    'order status': {
      message: 'To check your order status, please share your order ID. You can find it in your order confirmation email.',
      requiresHuman: false
    },
    'where is my order': {
      message: 'I\'ll help you locate your order! Please provide your order ID so I can check the current status and location.',
      requiresHuman: false
    },

    // Shipping
    'shipping': {
      message: 'We offer various shipping options from China to Africa! 🚢✈️\n\n• Sea Freight: 30-45 days (Most economical)\n• Air Freight: 7-14 days (Faster option)\n• Express: 3-7 days (Premium service)\n\nWould you like a quote for your shipment?',
      suggestions: ['Get shipping quote', 'Shipping times', 'Talk to human']
    },
    'shipping cost': {
      message: 'Shipping costs depend on:\n• Package weight and dimensions\n• Shipping method (sea/air/express)\n• Destination country\n\nWould you like me to connect you with our team for an accurate quote?',
      requiresHuman: true
    },
    'delivery time': {
      message: 'Delivery times vary by shipping method:\n\n🚢 Sea Freight: 30-45 days\n✈️ Air Freight: 7-14 days\n⚡ Express: 3-7 days\n\nWhich method are you interested in?',
      suggestions: ['Sea freight', 'Air freight', 'Express shipping']
    },

    // Products
    'product': {
      message: 'We can help you source products from China! 🛍️\n\nYou can:\n• Browse our featured products\n• Request custom sourcing\n• Get product quotes\n\nWhat would you like to do?',
      suggestions: ['Browse products', 'Custom sourcing', 'Get quote']
    },
    'price': {
      message: 'Product prices vary based on:\n• Quantity ordered\n• Product specifications\n• Supplier pricing\n• Shipping method\n\nWould you like me to connect you with our team for a detailed quote?',
      requiresHuman: true
    },

    // Payment
    'payment': {
      message: 'We accept multiple payment methods:\n\n💳 Credit/Debit Cards\n🏦 Bank Transfer\n📱 Mobile Money\n💰 TumaPay (Our payment platform)\n\nAll transactions are secure and encrypted.',
      suggestions: ['Payment methods', 'TumaPay info', 'Talk to human']
    },

    // Support
    'help': {
      message: 'I\'m here to help! I can assist with:\n\n📦 Order tracking\n🚢 Shipping information\n🛍️ Product sourcing\n💳 Payment questions\n📞 Connect with support team\n\nWhat do you need help with?',
      suggestions: ['Track order', 'Shipping info', 'Talk to human']
    },
    'human': {
      message: 'I\'ll connect you with a human support agent right away! 👤\n\nOne of our team members will respond shortly. In the meantime, feel free to describe your issue in detail.',
      requiresHuman: true
    },
    'agent': {
      message: 'Connecting you to a live agent... 👤\n\nPlease wait a moment while I transfer you to our support team.',
      requiresHuman: true
    },

    // Default
    'default': {
      message: 'I\'m not sure I understand. 🤔 Could you rephrase that?\n\nI can help with:\n• Order tracking\n• Shipping information\n• Product sourcing\n• Payment questions\n\nOr would you like to speak with a human agent?',
      suggestions: ['Track order', 'Shipping info', 'Products', 'Talk to human']
    }
  };

  getResponse(userMessage: string): ChatbotResponse {
    const message = userMessage.toLowerCase().trim();

    // Check for exact matches first
    for (const [key, response] of Object.entries(this.knowledgeBase)) {
      if (message.includes(key)) {
        return response;
      }
    }

    // Return default response
    return this.knowledgeBase['default'];
  }

  shouldTransferToHuman(userMessage: string): boolean {
    const message = userMessage.toLowerCase();
    const humanKeywords = ['human', 'agent', 'person', 'representative', 'speak to someone', 'talk to someone'];
    
    return humanKeywords.some(keyword => message.includes(keyword));
  }

  getQuickReplies(): string[] {
    return [
      'Track my order',
      'Shipping rates',
      'Place new order',
      'Payment methods',
      'Talk to human'
    ];
  }
}

export const chatbotService = new ChatbotService();
export default chatbotService;
