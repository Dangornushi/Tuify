import { AlertCircle } from 'lucide-react';

interface AuthErrorAlertProps {
  message: string | null;
}

export const AuthErrorAlert = ({ message }: AuthErrorAlertProps) => {
  if (!message) return null;

  return (
    <div className="mb-4 p-3 bg-terminal-error/10 border border-terminal-error rounded flex items-center gap-2">
      <AlertCircle className="w-5 h-5 text-terminal-error flex-shrink-0" />
      <p className="text-terminal-error text-sm">{message}</p>
    </div>
  );
};
