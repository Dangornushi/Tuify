import { Link, useNavigate } from 'react-router-dom';
import { Terminal, FolderOpen, LogOut, LogIn, UserPlus } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAuthActions } from '../../hooks/useAuth';

export const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { logout } = useAuthActions();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="bg-terminal-bg-secondary border-b border-terminal-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80">
            <Terminal className="w-6 h-6 text-terminal-accent" />
            <span className="text-xl font-bold text-terminal-accent">
              Tuify
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-4">
            <Link
              to="/editor"
              className="text-terminal-text hover:text-terminal-accent transition-colors"
            >
              Editor
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/projects"
                  className="flex items-center gap-1 text-terminal-text hover:text-terminal-accent transition-colors"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Projects</span>
                </Link>
                <span className="text-terminal-text-dim text-sm">
                  {user?.displayName || user?.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-terminal-text hover:text-terminal-error transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center gap-1 text-terminal-text hover:text-terminal-accent transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1 btn-primary text-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Sign Up</span>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
