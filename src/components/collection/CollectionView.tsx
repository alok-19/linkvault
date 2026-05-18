'use client';

import { useState, useEffect } from 'react';
import { Link as LinkType } from '@/types';
import { ArrowLeft, ExternalLink, Link2 } from 'lucide-react';
import Link from 'next/link';

interface CollectionViewProps {
  category: string;
  categoryLabel: string;
  categoryColor: string;
}

export function CollectionView({ category, categoryLabel, categoryColor }: CollectionViewProps) {
  const [links, setLinks] = useState<LinkType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/collections/${encodeURIComponent(category)}`)
      .then(res => res.json())
      .then(data => {
        setLinks(data.links || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [category]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </Link>

          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: categoryColor }}
            >
              <Link2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{categoryLabel}</h1>
              <p className="text-sm text-muted-foreground">
                {links.length} {links.length === 1 ? 'link' : 'links'} in this collection
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Links Grid */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-surface border border-border rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-video bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : links.length === 0 ? (
          <div className="text-center py-16">
            <Link2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-lg font-medium mb-2">No links yet</h2>
            <p className="text-sm text-muted-foreground">
              This collection is empty. Add some links from the dashboard.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {links.map(link => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-surface border border-border rounded-xl overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all"
                onClick={() => {
                  fetch(`/api/links/${link.id}/click`, { method: 'POST' });
                }}
              >
                <div className="relative aspect-video bg-background overflow-hidden">
                  {link.thumbnail_url ? (
                    <img
                      src={link.thumbnail_url}
                      alt={link.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${categoryColor}, ${categoryColor}cc)` }}
                    >
                      <span className="text-white text-3xl font-bold opacity-75">
                        {link.domain.replace('www.', '').split('.')[0].slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2">
                      <ExternalLink className="w-4 h-4 text-gray-900" />
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-medium text-sm truncate mb-1" title={link.title}>
                    {link.title || link.domain}
                  </h3>

                  {link.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {link.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    {link.favicon_url && (
                      <img src={link.favicon_url} alt="" className="w-4 h-4" />
                    )}
                    <span className="text-xs text-muted-foreground truncate flex-1">
                      {link.domain}
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm text-muted-foreground">
            Powered by <Link href="/" className="text-primary hover:underline">LinkVault</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
