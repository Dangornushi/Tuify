import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Loader2 } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: Props) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  // 認証状態確認中はローディング表示
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-terminal-bg">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-terminal-accent animate-spin" />
          <p className="text-terminal-text-dim">Loading...</p>
        </div>
      </div>
    );
  }

  // 未認証の場合はログインページへリダイレクト
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
