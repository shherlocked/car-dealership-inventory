import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, X, XCircle } from 'lucide-react';

type ToastTone = 'success' | 'error';

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  toast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const AUTO_DISMISS_MS = 4000;

/**
 * Provides a lightweight toast system. Toasts stack in the bottom-right on
 * desktop and across the top on mobile, auto-dismiss and can be dismissed.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      const id = ++idRef.current;
      setToasts((current) => [...current, { id, message, tone }]);
      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          aria-label="Notifications"
          className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-4 pt-4 sm:inset-x-auto sm:bottom-4 sm:right-4 sm:top-auto sm:items-end sm:px-0 sm:pt-0"
        >
          {toasts.map((item) => (
            <div
              key={item.id}
              role="status"
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl2 border border-line bg-surface-raised px-4 py-3 shadow-modal animate-toast-in"
            >
              {item.tone === 'success' ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-ok" aria-hidden="true" />
              ) : (
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden="true" />
              )}
              <p className="flex-1 text-sm text-slate-100">{item.message}</p>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss notification"
                className="rounded-md p-1 text-slate-400 transition-colors hover:bg-surface-200 hover:text-slate-100"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

/** Hook to show toasts; must be used within a ToastProvider. */
// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
