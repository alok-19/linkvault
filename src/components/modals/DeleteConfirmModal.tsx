'use client';

import { X, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  linkTitle: string;
}

export function DeleteConfirmModal({ isOpen, onClose, onConfirm, linkTitle }: DeleteConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-sm bg-surface border border-border rounded-xl shadow-2xl p-6 pointer-events-auto"
            >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Delete Link</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete <span className="font-medium text-foreground">{linkTitle}</span>? This action cannot be undone.
            </p>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="btn-primary flex-1 bg-red-500 hover:bg-red-600 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
