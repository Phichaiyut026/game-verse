'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { CircleCheck, CircleAlert } from 'lucide-react';

type Kind = 'success' | 'error';
type ToastFn = (msg: string, kind?: Kind) => void;
interface ToastItem { id: number; msg: string; kind: Kind }

const ToastContext = createContext<ToastFn>(() => {});
let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback<ToastFn>((msg, kind = 'success') => {
    const id = ++nextId;
    setItems(list => [...list, { id, msg, kind }]);
    setTimeout(() => setItems(list => list.filter(t => t.id !== id)), 3000);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map(t => (
          <div key={t.id} className={`toast ${t.kind === 'error' ? 'err' : ''}`}>
            {t.kind === 'error' ? <CircleAlert size={18} /> : <CircleCheck size={18} />}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
