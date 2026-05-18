'use client';

import { X, Keyboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShortcutsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { key: '/', action: 'Focus search bar' },
  { key: 'n', action: 'Add new link' },
  { key: 'j / k', action: 'Navigate cards down / up' },
  { key: 'Enter', action: 'Open selected link' },
  { key: 'x', action: 'Select / deselect card' },
  { key: 'd', action: 'Delete selected card' },
  { key: 'Esc', action: 'Close modal / clear search' },
  { key: '?', action: 'Show this help' },
];

export function ShortcutsHelpModal({ isOpen, onClose }: ShortcutsHelpModalProps) {
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

          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-sm bg-surface border border-border rounded-xl shadow-2xl pointer-events-auto"
            >
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6">
                <div className="space-y-3">
                  {shortcuts.map(({ key, action }) => (
                    <div key={key} className="flex items-center justify-between">
                      <kbd className="px-2 py-1 bg-background border border-border rounded-md text-xs font-mono font-medium min-w-[80px] text-center">
                        {key}
                      </kbd>
                      <span className="text-sm text-muted-foreground flex-1 text-right ml-4">
                        {action}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
