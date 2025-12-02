import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface FraudNotification {
  id: string;
  merchant: string;
  amount: string;
  timestamp: Date;
  reason: string;
}

interface NotificationContextType {
  notifications: FraudNotification[];
  addNotification: (notification: FraudNotification) => void;
  clearNotifications: () => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<FraudNotification[]>([]);

  const addNotification = useCallback((notification: FraudNotification) => {
    setNotifications((prev) => [notification, ...prev].slice(0, 10)); // Keep last 10
    // Auto-remove after 10 seconds
    setTimeout(() => {
      removeNotification(notification.id);
    }, 10000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, addNotification, clearNotifications, removeNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
