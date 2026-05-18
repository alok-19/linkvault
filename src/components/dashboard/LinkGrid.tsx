'use client';

import { Link as LinkType } from '@/types';
import { LinkCard } from './LinkCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '../ui/Skeleton';

interface LinkGridProps {
  links: LinkType[];
  loading: boolean;
  totalLinks: number;
  onDelete: (id: number) => void;
  onEdit: (link: LinkType) => void;
  selectedIndex?: number;
  selectedLinkIds?: Set<number>;
}

export function LinkGrid({ links, loading, totalLinks, onDelete, onEdit, selectedIndex = -1, selectedLinkIds }: LinkGridProps) {
  if (loading && totalLinks > 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: Math.min(8, totalLinks) }).map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-xl overflow-hidden">
            <Skeleton className="aspect-video" />
            <div className="p-3 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/2" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (links.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <AnimatePresence mode="popLayout">
        {links.map((link, index) => (
          <LinkCard
            key={link.id}
            link={link}
            onDelete={onDelete}
            onEdit={onEdit}
            isSelected={index === selectedIndex}
            isMultiSelected={selectedLinkIds?.has(link.id) ?? false}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
