import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface UseFormModalOptions<T> {
  onSuccess?: (result?: T) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

interface UseFormModalReturn<T, F> {
  isOpen: boolean;
  isLoading: boolean;
  formData: F;
  open: (initialData?: Partial<F>) => void;
  close: () => void;
  setFormData: React.Dispatch<React.SetStateAction<F>>;
  updateField: (field: keyof F, value: F[keyof F]) => void;
  submit: (submitFn: (data: F) => Promise<T>) => Promise<void>;
}

/**
 * Generic hook for CRUD modals. Replaces the repeated pattern of:
 *   const [isOpen, setIsOpen] = useState(false);
 *   const [loading, setLoading] = useState(false);
 *   const [formData, setFormData] = useState({...});
 *   const handleSubmit = async () => { validation + API + toast };
 *
 * Usage:
 *   const modal = useFormModal({ onSuccess: refetch, successMessage: 'Créé !' });
 *   // Open: modal.open()  or  modal.open({ name: 'prefilled' })
 *   // Submit: modal.submit(() => myService.create(modal.formData))
 */
export function useFormModal<T = void, F extends Record<string, unknown> = Record<string, unknown>>(
  initialFormData: F,
  options: UseFormModalOptions<T> = {}
): UseFormModalReturn<T, F> {
  const { onSuccess, onError, successMessage, errorMessage } = options;
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<F>(initialFormData);

  const open = useCallback((initialData?: Partial<F>) => {
    setFormData(initialData ? { ...initialFormData, ...initialData } : initialFormData);
    setIsOpen(true);
  }, [initialFormData]);

  const close = useCallback(() => {
    if (isLoading) return;
    setIsOpen(false);
    setFormData(initialFormData);
  }, [isLoading, initialFormData]);

  const updateField = useCallback((field: keyof F, value: F[keyof F]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const submit = useCallback(async (submitFn: (data: F) => Promise<T>) => {
    setIsLoading(true);
    try {
      const result = await submitFn(formData);
      if (successMessage) toast.success(successMessage);
      onSuccess?.(result);
      setIsOpen(false);
      setFormData(initialFormData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      if (errorMessage) toast.error(errorMessage);
      else toast.error(error.message || 'Une erreur est survenue');
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [formData, initialFormData, successMessage, errorMessage, onSuccess, onError]);

  return { isOpen, isLoading, formData, open, close, setFormData, updateField, submit };
}
