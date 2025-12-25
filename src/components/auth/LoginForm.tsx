import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { loginSchema, LoginInput } from '../../validation/schemas';
import { useAuthActions } from '../../hooks/useAuth';
import { AppError } from '../../utils/errorHandler';

export const LoginForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthActions();
  const [serverError, setServerError] = useState<string | null>(null);

  const from = (location.state as { from?: Location })?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    try {
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (error) {
      const appError = AppError.fromFirebase(error);
      setServerError(appError.message);
    }
  };

  return (
    <div className="w-full max-w-md">
      <h1 className="text-2xl font-bold text-terminal-accent mb-6 text-center">
        Login
      </h1>

      {serverError && (
        <div className="mb-4 p-3 bg-terminal-error/10 border border-terminal-error rounded flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-terminal-error flex-shrink-0" />
          <p className="text-terminal-error text-sm">{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm text-terminal-text-dim mb-1"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className="input-field"
            placeholder="your@email.com"
          />
          {errors.email && (
            <p className="text-terminal-error text-sm mt-1">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm text-terminal-text-dim mb-1"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            {...register('password')}
            className="input-field"
            placeholder="********"
          />
          {errors.password && (
            <p className="text-terminal-error text-sm mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full btn-primary flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Logging in...</span>
            </>
          ) : (
            <span>Login</span>
          )}
        </button>
      </form>

      <p className="mt-4 text-center text-terminal-text-dim text-sm">
        Don't have an account?{' '}
        <Link to="/register" className="text-terminal-accent hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
};
