import { Terminal } from 'lucide-react';
import { RegisterForm } from '../components/auth/RegisterForm';

export const RegisterPage = () => {
  return (
    <div className="min-h-screen bg-terminal-bg flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex items-center gap-2">
        <Terminal className="w-8 h-8 text-terminal-accent" />
        <span className="text-2xl font-bold text-terminal-accent">Tuify</span>
      </div>

      <div className="w-full max-w-md">
        <div className="card">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
};
