'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link as LinkType, CATEGORIES } from '@/types';

interface EditLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: LinkType | null;
  onSuccess?: () => void;
}

export function EditLinkModal({ isOpen, onClose, link, onSuccess }: EditLinkModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('uncategorized');
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (link) {
      setTitle(link.title);
      setDescription(link.description);
      setCategory(link.category);
      setTagsInput(link.tags.join(', '));
    }
  }, [link]);

  if (!link) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

    try {
      const response = await fetch(`/api/links/${link.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, category, tags }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update link');
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update link');
    } finally {
      setLoading(false);
    }
  };

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
              className="w-full max-w-md bg-surface border border-border rounded-xl shadow-2xl p-6 pointer-events-auto"
            >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Edit Link</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">URL</label>
                <p className="text-sm truncate">{link.url}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-default"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="input-default resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input-default"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.name} value={cat.name}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tags</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="tag1, tag2, tag3"
                  className="input-default"
                />
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
