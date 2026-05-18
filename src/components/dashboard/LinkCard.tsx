'use client';

import { Link as LinkType, CATEGORIES, LinkStatus } from '@/types';
import { formatTimeAgo, cn, decodeHtmlEntities } from '@/lib/utils';
import { ExternalLink, Pencil, Trash2, Link, AlertTriangle, Clock } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface LinkCardProps {
  link: LinkType;
  onDelete: (id: number) => void;
  onEdit: (link: LinkType) => void;
  isSelected?: boolean;
  isMultiSelected?: boolean;
}

export function LinkCard({ link, onDelete, onEdit, isSelected = false, isMultiSelected = false }: LinkCardProps) {
  const [imageError, setImageError] = useState(false);
  const category = CATEGORIES.find(c => c.name === link.category);

  const handleClick = async () => {
    await fetch(`/api/links/${link.id}/click`, { method: 'POST' });
    window.open(link.url, '_blank');
  };

  const thumbnailSrc = link.thumbnail_url && !imageError
    ? link.thumbnail_url.replace(/&amp;/g, '&')
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`group bg-surface border rounded-xl overflow-hidden card-hover transition-all ${
        isSelected ? 'ring-2 ring-primary border-primary' : 'border-border'
      } ${isMultiSelected ? 'ring-1 ring-primary/50' : ''}`}
    >
      <div className="relative aspect-video bg-background overflow-hidden cursor-pointer" onClick={handleClick}>
        {thumbnailSrc ? (
          <img
            src={thumbnailSrc}
            alt={decodeHtmlEntities(link.title)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${category?.color || '#6366f1'}, ${category?.color || '#6366f1'}cc)`,
            }}
          >
            <span className="text-white text-4xl font-bold opacity-75 tracking-wider">
              {link.domain.replace('www.', '').split('.')[0].slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2">
            <ExternalLink className="w-5 h-5 text-gray-900" />
          </div>
        </div>

        {link.favicon_url && (
          <div className="absolute top-2 left-2 w-6 h-6 bg-white rounded-md shadow-sm flex items-center justify-center overflow-hidden">
            <img
              src={link.favicon_url.replace(/&amp;/g, '&')}
              alt=""
              className="w-4 h-4"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          </div>
        )}

        {link.is_broken === 1 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Broken
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-medium text-sm truncate mb-1" title={decodeHtmlEntities(link.title)}>
          {decodeHtmlEntities(link.title) || link.domain}
        </h3>

        {link.description && (
          <p className="text-xs text-muted-foreground line-clamp-3 mb-2">
            {decodeHtmlEntities(link.description)}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            {link.status !== 'unread' && (
              <StatusBadge status={link.status} />
            )}
            {category && (
              <span
                className="badge text-white"
                style={{ backgroundColor: category.color }}
              >
                {category.label}
              </span>
            )}

            {link.tags.slice(0, 2).map(tag => (
              <span key={tag} className="badge bg-muted text-muted-foreground">
                {tag}
              </span>
            ))}

            {link.tags.length > 2 && (
              <span className="text-xs text-muted-foreground">+{link.tags.length - 2}</span>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(link)}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
              title="Edit"
            >
              <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <button
              onClick={() => onDelete(link.id)}
              className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
          <Link className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground truncate">{link.domain}</span>
          {link.reading_time > 0 && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {link.reading_time} min
            </span>
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            {formatTimeAgo(link.created_at)}
          </span>
          {link.click_count > 0 && (
            <span className="text-xs text-muted-foreground">
              {link.click_count} clicks
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: LinkStatus }) {
  const config = {
    unread: { label: 'Unread', color: '#ef4444' },
    reading: { label: 'Reading', color: '#f59e0b' },
    archived: { label: 'Archived', color: '#22c55e' },
  };

  const { label, color } = config[status];

  return (
    <span
      className="badge text-white"
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  );
}
