'use client';

import { Plus, Download } from 'lucide-react';
import { useState } from 'react';
import { AddLinkModal } from '../modals/AddLinkModal';

interface EmptyStateProps {
  onLinkAdded?: () => void;
}

export function EmptyState({ onLinkAdded }: EmptyStateProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-violet-500/20 rounded-2xl flex items-center justify-center mb-6">
          <Plus className="w-10 h-10 text-primary" />
        </div>

        <h2 className="text-xl font-semibold mb-2">No links saved yet</h2>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          Install the LinkVault extension to save links with one click, or add your first link manually below.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Your First Link
          </button>
        </div>

        <div className="mt-8 p-4 bg-surface border border-border rounded-lg max-w-md">
          <h3 className="font-medium text-sm mb-2">Install the Extension</h3>
          <ol className="text-sm text-muted-foreground space-y-1">
            <li>1. Open Chrome/Edge and go to <code className="bg-muted px-1 rounded">chrome://extensions</code></li>
            <li>2. Enable "Developer mode"</li>
            <li>3. Click "Load unpacked" and select the <code className="bg-muted px-1 rounded">extension/</code> folder</li>
            <li>4. Click the LinkVault icon on any page to save it!</li>
          </ol>
        </div>
      </div>

      <AddLinkModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          onLinkAdded?.();
          setShowModal(false);
        }}
      />
    </>
  );
}
