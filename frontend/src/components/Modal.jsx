import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden"
                    >
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
                            <button
                                onClick={onClose}
                                className="p-2 text-slate-500 hover:text-slate-700 transition-colors rounded-lg hover:bg-slate-200"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
