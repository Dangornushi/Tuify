import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { registerSchema, RegisterInput } from '../../validation/schemas';
import { useAuthActions } from '../../hooks/useAuth';
import { AppError } from '../../utils/errorHandler';
import { AuthFormField } from './AuthFormField';
import { AuthErrorAlert } from './AuthErrorAlert';
import { AuthSubmitButton } from './AuthSubmitButton';

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
          hint="8 characters minimum, must include letters and numbers"
        />

        <AuthFormField
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          placeholder="********"
          registration={register('confirmPassword')}
          error={errors.confirmPassword}
        />

        <AuthSubmitButton
          isSubmitting={isSubmitting}
          label="Sign Up"
          loadingLabel="Creating account..."
        />
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
