import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast() {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        const handleToast = (e) => {
            const newToast = {
                id: Date.now(),
                message: e.detail.message,
                type: e.detail.type || 'info', // 'success', 'error', 'info'
            };
            setToasts((prev) => [...prev, newToast]);

            // Auto dismiss
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
            }, 3000);
        };

        window.addEventListener('trigger_toast', handleToast);
        return () => window.removeEventListener('trigger_toast', handleToast);
    }, []);

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <div className="fixed top-20 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 50, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className="pointer-events-auto flex items-center gap-3 min-w-[300px] max-w-sm bg-slate-900 border border-slate-700 shadow-2xl p-4 rounded-xl text-slate-200"
                    >
                        {toast.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />}
                        {toast.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />}
                        {toast.type === 'info' && <Info className="h-5 w-5 text-blue-400 shrink-0" />}

                        <p className="text-sm font-medium flex-1">{toast.message}</p>

                        <button onClick={() => removeToast(toast.id)} className="text-slate-500 hover:text-slate-300 transition-colors shrink-0">
                            <X className="h-4 w-4" />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
