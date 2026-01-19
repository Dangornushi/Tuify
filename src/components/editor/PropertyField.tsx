import { ReactNode } from 'react';

interface PropertyFieldProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export const PropertyField = ({ label, children, className = '' }: PropertyFieldProps) => {
  return (
    <div className={className}>
      <label className="block text-sm text-terminal-text-dim mb-1">
        {label}
      </label>
      {children}
    </div>
  );
};

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const TextField = ({
  label,
  value,
  onChange,
  placeholder,
  className = '',
}: TextFieldProps) => {
  return (
    <PropertyField label={label} className={className}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field"
        placeholder={placeholder}
      />
    </PropertyField>
  );
};

interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const TextAreaField = ({
  label,
  value,
  onChange,
  placeholder,
  className = '',
}: TextAreaFieldProps) => {
  return (
    <PropertyField label={label} className={className}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field min-h-[100px] resize-y"
        placeholder={placeholder}
      />
    </PropertyField>
  );
};

interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}

export const SelectField = <T extends string>({
  label,
  value,
  onChange,
  options,
  className = '',
}: SelectFieldProps<T>) => {
  return (
    <PropertyField label={label} className={className}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="input-field"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </PropertyField>
  );
};

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const ColorField = ({
  label,
  value,
  onChange,
  className = '',
}: ColorFieldProps) => {
  return (
    <PropertyField label={label} className={className}>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-8 bg-transparent border border-terminal-border rounded cursor-pointer"
      />
    </PropertyField>
  );
};
