import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { loginSchema, LoginInput } from '../../validation/schemas';
import { useAuthActions } from '../../hooks/useAuth';
import { AppError } from '../../utils/errorHandler';
import { AuthFormField } from './AuthFormField';
import { AuthErrorAlert } from './AuthErrorAlert';
import { AuthSubmitButton } from './AuthSubmitButton';

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

      <AuthErrorAlert message={serverError} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <AuthFormField
          id="email"
          label="Email"
          type="email"
          placeholder="your@email.com"
          registration={register('email')}
          error={errors.email}
        />

        <AuthFormField
          id="password"
          label="Password"
          type="password"
          placeholder="********"
          registration={register('password')}
          error={errors.password}
        />

        <AuthSubmitButton
          isSubmitting={isSubmitting}
          label="Login"
          loadingLabel="Logging in..."
        />
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
