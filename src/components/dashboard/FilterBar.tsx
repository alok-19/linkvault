'use client';

import { CATEGORIES } from '@/types';
import { cn } from '@/lib/utils';
import { ArrowDownAZ, ArrowUpAZ, Clock, MousePointerClick, Globe, Share2, Check } from 'lucide-react';
import { useState } from 'react';

interface FilterBarProps {
  categories: Record<string, number>;
  totalLinks: number;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  activeStatus: string;
  onStatusChange: (status: string) => void;
  statusCounts: Record<string, number>;
  sort: string;
  onSortChange: (sort: string) => void;
}

const sortOptions = [
  { value: 'newest', label: 'Newest', icon: Clock },
  { value: 'oldest', label: 'Oldest', icon: Clock },
  { value: 'most_clicked', label: 'Most Clicked', icon: MousePointerClick },
  { value: 'alphabetical', label: 'A-Z', icon: ArrowDownAZ },
  { value: 'domain', label: 'Domain', icon: Globe },
];

const statusOptions = [
  { value: 'unread', label: 'Unread', color: '#ef4444' },
  { value: 'reading', label: 'Reading', color: '#f59e0b' },
  { value: 'archived', label: 'Archived', color: '#22c55e' },
];

export function FilterBar({
  categories,
  totalLinks,
  activeCategory,
  onCategoryChange,
  activeStatus,
  onStatusChange,
  statusCounts,
  sort,
  onSortChange,
}: FilterBarProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (activeCategory === 'all') return;
    const url = `${window.location.origin}/c/${encodeURIComponent(activeCategory)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="border-b border-border bg-surface/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-1 sm:pb-0">
            <button
              onClick={() => onCategoryChange('all')}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                activeCategory === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-background border border-border hover:bg-muted'
              )}
            >
              All ({totalLinks})
            </button>

            {CATEGORIES.filter(c => c.name !== 'uncategorized').map(cat => (
              categories[cat.name] ? (
                <button
                  key={cat.name}
                  onClick={() => onCategoryChange(cat.name)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                    activeCategory === cat.name
                      ? 'text-white'
                      : 'bg-background border border-border hover:bg-muted'
                  )}
                  style={activeCategory === cat.name ? { backgroundColor: cat.color } : {}}
                >
                  {cat.label} ({categories[cat.name]})
                </button>
              ) : null
            ))}

            {categories['uncategorized'] ? (
              <button
                onClick={() => onCategoryChange('uncategorized')}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                  activeCategory === 'uncategorized'
                    ? 'bg-gray-500 text-white'
                    : 'bg-background border border-border hover:bg-muted'
                )}
              >
                Uncategorized ({categories['uncategorized']})
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {activeCategory !== 'all' && (
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-background border border-border rounded-lg text-sm hover:bg-muted transition-colors"
                title="Share collection"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-green-600">Copied!</span>
              </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Share</span>
                  </>
                )}
              </button>
            )}

            <span className="text-sm text-muted-foreground">Sort:</span>
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value)}
              className="px-2 py-1.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2 mt-2 overflow-x-auto scrollbar-thin pb-1 sm:pb-0">
          {statusOptions.map(({ value, label, color }) => (
            <button
              key={value}
              onClick={() => onStatusChange(value)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors border',
                activeStatus === value
                  ? 'text-white border-transparent'
                  : 'bg-background border-border hover:bg-muted text-muted-foreground'
              )}
              style={activeStatus === value ? { backgroundColor: color } : {}}
            >
              {label} ({statusCounts[value] || 0})
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
