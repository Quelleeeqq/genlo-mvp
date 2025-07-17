"use client";

import { createContext, useContext, useState, useCallback, useRef, ReactNode, useEffect } from 'react';
import { XCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const typeStyles = {
  success: {
    icon: CheckCircle,
    bg: 'bg-green-600',
    text: 'text-white',
  },
  error: {
    icon: XCircle,
    bg: 'bg-red-600',
    text: 'text-white',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-600',
    text: 'text-white',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-yellow-500',
    text: 'text-black',
  },
};

// Standalone Toast component for direct use
export function Toast({ 
  message, 
  type = 'info', 
  onClose 
}: { 
  message: string; 
  type?: ToastType; 
  onClose?: () => void;
}) {
  const style = typeStyles[type];
  const Icon = style.icon;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${style.bg} ${style.text} min-w-[220px] max-w-xs animate-fade-in-up`}
      role="status"
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="flex-1 text-sm font-medium">{message}</span>
      {onClose && (
        <button onClick={onClose} className="ml-2 p-1 rounded hover:bg-black/10">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed z-50 top-4 right-4 flex flex-col gap-2 items-end">
        {toasts.map((toast) => {
          const style = typeStyles[toast.type];
          const Icon = style.icon;
          return (
            <div
              key={toast.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${style.bg} ${style.text} min-w-[220px] max-w-xs animate-fade-in-up`}
              role="status"
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1 text-sm font-medium">{toast.message}</span>
              <button onClick={() => removeToast(toast.id)} className="ml-2 p-1 rounded hover:bg-black/10">
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
      <style jsx global>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease;
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
} 