import { ReactNode } from 'react';
import { XCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export type AlertType = 'error' | 'success' | 'info' | 'warning';

const typeStyles = {
  error: {
    icon: XCircle,
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    iconColor: 'text-red-500',
  },
  success: {
    icon: CheckCircle,
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    iconColor: 'text-green-500',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    iconColor: 'text-blue-500',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    iconColor: 'text-yellow-500',
  },
};

interface AlertProps {
  type?: AlertType;
  children: ReactNode;
  className?: string;
}

export default function Alert({ type = 'info', children, className = '' }: AlertProps) {
  const style = typeStyles[type];
  const Icon = style.icon;
  return (
    <div
      className={`flex items-center gap-2 rounded-lg p-3 border ${style.bg} ${style.border} ${style.text} ${className}`}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <Icon className={`w-5 h-5 ${style.iconColor}`} aria-hidden="true" />
      <span className="flex-1">{children}</span>
    </div>
  );
} 