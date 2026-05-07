import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSmartBack } from '@/hooks/useSmartBack';

interface Props {
  /** Optional explicit label. Defaults to "Retour". */
  label?: string;
  /** Fallback path when there's no history to go back to. */
  fallback?: string;
  /** ShadCN button variant. */
  variant?: 'ghost' | 'outline' | 'default' | 'secondary';
  /** Optional custom CSS class. */
  className?: string;
  /** data-testid for QA. */
  testId?: string;
}

/**
 * Universal back button that uses browser history to return to the previous page.
 * Falls back to `fallback` prop when accessed via direct URL.
 *
 * Drop-in replacement for hard-coded "Retour à X" buttons.
 *
 * @example
 *   <SmartBackButton fallback="/formations" />
 */
const SmartBackButton: React.FC<Props> = ({
  label = 'Retour',
  fallback = '/',
  variant = 'ghost',
  className,
  testId = 'smart-back-button',
}) => {
  const goBack = useSmartBack({ fallback });
  return (
    <Button
      variant={variant}
      onClick={goBack}
      className={`gap-2 ${className || ''}`}
      data-testid={testId}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
};

export default SmartBackButton;
