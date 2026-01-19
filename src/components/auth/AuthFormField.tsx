import { FieldError, UseFormRegisterReturn } from 'react-hook-form';

interface AuthFormFieldProps {
  id: string;
  label: string;
  type: 'email' | 'password' | 'text';
  placeholder: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
  hint?: string;
}

export const AuthFormField = ({
  id,
  label,
  type,
  placeholder,
  registration,
  error,
  hint,
}: AuthFormFieldProps) => {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm text-terminal-text-dim mb-1"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        {...registration}
        className="input-field"
        placeholder={placeholder}
      />
      {error && (
        <p className="text-terminal-error text-sm mt-1">{error.message}</p>
      )}
      {hint && (
        <p className="text-terminal-text-dim text-xs mt-1">{hint}</p>
      )}
    </div>
  );
};
