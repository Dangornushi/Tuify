import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { registerSchema, RegisterInput } from '../../validation/schemas';
import { useAuthActions } from '../../hooks/useAuth';
import { AppError } from '../../utils/errorHandler';

export const RegisterForm = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuthActions();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null);
    try {
      await registerUser(data.email, data.password);
      navigate('/editor');
    } catch (error) {
      const appError = AppError.fromFirebase(error);
      setServerError(appError.message);
    }
  };

  return (
    <div className="w-full max-w-md">
      <h1 className="text-2xl font-bold text-terminal-accent mb-6 text-center">
        Create Account
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
          <p className="text-terminal-text-dim text-xs mt-1">
            8 characters minimum, must include letters and numbers
          </p>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm text-terminal-text-dim mb-1"
          >
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            {...register('confirmPassword')}
            className="input-field"
            placeholder="********"
          />
          {errors.confirmPassword && (
            <p className="text-terminal-error text-sm mt-1">
              {errors.confirmPassword.message}
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
              <span>Creating account...</span>
            </>
          ) : (
            <span>Sign Up</span>
          )}
        </button>
      </form>

      <p className="mt-4 text-center text-terminal-text-dim text-sm">
        Already have an account?{' '}
        <Link to="/login" className="text-terminal-accent hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
};
