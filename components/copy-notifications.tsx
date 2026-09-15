'use client';

import { CheckCircle2, AlertCircle } from 'lucide-react';
import {
  toast,
  ToastProvider,
  ToastPortal,
  ToastViewport,
  Toast,
  ToastContent,
  ToastTitle,
  ToastClose,
  useToastManager,
} from '@/components/ui/toast';

export async function copyWithNotice(text: string, title = 'Link copiado!') {
  try {
    await navigator.clipboard.writeText(text);
    toast.add({ title, type: 'success', timeout: 3000 });
    return true;
  } catch {
    toast.add({
      title: 'Não foi possível copiar. Tente novamente.',
      type: 'error',
      timeout: 5000,
    });
    return false;
  }
}

function Notices() {
  const { toasts } = useToastManager();
  return (
    <ToastPortal>
      <ToastViewport className="copy-notice-viewport">
        {toasts.map((item) => (
          <Toast
            key={item.id}
            toast={item}
            className={`copy-notice copy-notice-${item.type}`}
          >
            <ToastContent>
              {item.type === 'error' ? (
                <AlertCircle aria-hidden="true" />
              ) : (
                <CheckCircle2 aria-hidden="true" />
              )}
              <ToastTitle className="copy-notice-title" />
              <ToastClose
                aria-label="Fechar notificação"
                className="copy-notice-close"
              />
            </ToastContent>
          </Toast>
        ))}
      </ToastViewport>
    </ToastPortal>
  );
}

export function CopyNotifications() {
  return (
    <ToastProvider toastManager={toast} limit={3}>
      <Notices />
    </ToastProvider>
  );
}
