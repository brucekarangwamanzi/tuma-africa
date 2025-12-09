class NotificationService {
  private permission: NotificationPermission = 'default';

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.permission = 'granted';
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    }

    return false;
  }

  showNotification(title: string, options?: NotificationOptions) {
    if (this.permission !== 'granted') {
      return;
    }

    const notification = new Notification(title, {
      icon: '/logo192.png',
      badge: '/logo192.png',
      ...options
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  }

  showMessageNotification(senderName: string, message: string, chatId?: string) {
    this.showNotification(`New message from ${senderName}`, {
      body: message,
      tag: chatId || 'chat-message',
      requireInteraction: false,
      data: { chatId }
    });
  }

  showOrderNotification(title: string, message: string, orderId?: string) {
    this.showNotification(title, {
      body: message,
      tag: orderId || 'order-update',
      requireInteraction: false,
      data: { orderId }
    });
  }

  isSupported(): boolean {
    return 'Notification' in window;
  }

  getPermission(): NotificationPermission {
    return this.permission;
  }
}

export const notificationService = new NotificationService();
export default notificationService;
