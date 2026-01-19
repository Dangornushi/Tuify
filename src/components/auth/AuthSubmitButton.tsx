import { Loader2 } from 'lucide-react';

interface AuthSubmitButtonProps {
  isSubmitting: boolean;
  label: string;
  loadingLabel: string;
}

export const AuthSubmitButton = ({
  isSubmitting,
  label,
  loadingLabel,
}: AuthSubmitButtonProps) => {
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className="w-full btn-primary flex items-center justify-center gap-2"
    >
      {isSubmitting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{loadingLabel}</span>
        </>
      ) : (
        <span>{label}</span>
      )}
    </button>
  );
};
