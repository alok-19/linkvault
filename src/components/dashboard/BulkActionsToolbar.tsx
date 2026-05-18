'use client';

import { LinkStatus } from '@/types';
import { cn } from '@/lib/utils';
import { Archive, BookOpen, Trash2, X, Check, Tag, FolderOpen } from 'lucide-react';

interface BulkActionsToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onDelete: () => void;
  onStatusChange: (status: LinkStatus) => void;
}

const statusOptions: { value: LinkStatus; label: string; icon: typeof BookOpen }[] = [
  { value: 'unread', label: 'Mark Unread', icon: BookOpen },
  { value: 'reading', label: 'Mark Reading', icon: BookOpen },
  { value: 'archived', label: 'Archive', icon: Archive },
];

export function BulkActionsToolbar({
  selectedCount,
  onClearSelection,
  onDelete,
  onStatusChange,
}: BulkActionsToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      <div className="flex items-center gap-2 bg-surface border border-border rounded-xl shadow-lg px-4 py-2.5">
        <div className="flex items-center gap-1.5 pr-3 border-r border-border">
          <Check className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">{selectedCount} selected</span>
        </div>

        <div className="flex items-center gap-1">
          {statusOptions.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => onStatusChange(value)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-muted transition-colors"
              title={label}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-border mx-1" />

        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Delete selected"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Delete</span>
        </button>

        <button
          onClick={onClearSelection}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors ml-1"
          title="Clear selection"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
