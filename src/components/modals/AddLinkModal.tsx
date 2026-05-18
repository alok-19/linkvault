'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORIES } from '@/types';

interface AddLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialUrl?: string;
  initialTitle?: string;
}

export function AddLinkModal({ isOpen, onClose, onSuccess, initialUrl = '', initialTitle = '' }: AddLinkModalProps) {
  const [url, setUrl] = useState(initialUrl);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('uncategorized');
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [error, setError] = useState('');

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setUrl(initialUrl);
      setTitle(initialTitle);
      setDescription('');
      setCategory('uncategorized');
      setTagsInput('');
      setError('');
      setFetchingMetadata(false);
    }
  }, [isOpen, initialUrl, initialTitle]);

  const fetchMetadata = useCallback(async (targetUrl: string) => {
    if (!targetUrl || !targetUrl.includes('.')) return;

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setFetchingMetadata(true);
    try {
      const response = await fetch('/api/extract-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) return;

      const data = await response.json();

      // Only auto-fill fields that are still empty
      setTitle(prev => prev || data.title || '');
      setDescription(prev => prev || data.description || '');
      setCategory(prev => {
        if (prev !== 'uncategorized') return prev;
        return data.category && data.category !== 'uncategorized' ? data.category : 'uncategorized';
      });
      setTagsInput(prev => prev || (data.suggestedTags?.join(', ') || ''));
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Failed to fetch metadata:', err);
    } finally {
      setFetchingMetadata(false);
    }
  }, []);

  const handleUrlChange = (value: string) => {
    setUrl(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (value && value.includes('.')) {
        fetchMetadata(value);
      }
    }, 600);
  };

  const handleUrlBlur = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (url && !title) {
      fetchMetadata(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!url) {
      setError('URL is required');
      setLoading(false);
      return;
    }

    let finalUrl = url;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
      setUrl(finalUrl);
    }

    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: finalUrl, title, description, category, tags }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save link');
      }

      if (data.alreadyExists) {
        setError('This link is already saved!');
        setLoading(false);
        return;
      }

      setUrl('');
      setTitle('');
      setDescription('');
      setCategory('uncategorized');
      setTagsInput('');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save link');
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
              <h2 className="text-lg font-semibold">Add Link</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">URL *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    onBlur={handleUrlBlur}
                    placeholder="https://example.com"
                    className="input-default pr-10"
                    autoFocus
                  />
                  {fetchingMetadata && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Auto-filled if empty"
                  className="input-default"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Auto-filled if empty"
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
                    'Save Link'
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
