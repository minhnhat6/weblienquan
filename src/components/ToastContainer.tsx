/**
 * ToastContainer Component
 * Displays notification toasts from auth context
 */

'use client';

import { useAuth } from '@/lib/auth';

export default function ToastContainer() {
  const { toasts } = useAuth();
  
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}
