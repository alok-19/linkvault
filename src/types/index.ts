export type LinkStatus = 'unread' | 'reading' | 'archived';

export interface Link {
  id: number;
  url: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  thumbnail_url: string | null;
  thumbnail_type: 'og' | 'fallback';
  favicon_url: string | null;
  domain: string;
  click_count: number;
  last_clicked: string | null;
  status: LinkStatus;
  content: string;
  reading_time: number;
  is_broken: number;
  last_checked: string | null;
  created_at: string;
  updated_at: string;
}

export interface LinkInput {
  url: string;
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
}

export interface LinkUpdate {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
}

export interface ThumbnailCache {
  url: string;
  og_image: string | null;
  fetched_at: string;
}

export interface DashboardStats {
  total: number;
  categories: Record<string, number>;
  top_domains: { domain: string; count: number }[];
  recent: Link[];
  total_clicks: number;
  status_counts: Record<string, number>;
}

export const CATEGORIES = [
  { name: 'dev-tools', color: '#6366f1', label: 'Dev Tools' },
  { name: 'social', color: '#ec4899', label: 'Social' },
  { name: 'news', color: '#f59e0b', label: 'News' },
  { name: 'design', color: '#8b5cf6', label: 'Design' },
  { name: 'productivity', color: '#22c55e', label: 'Productivity' },
  { name: 'learning', color: '#06b6d4', label: 'Learning' },
  { name: 'entertainment', color: '#f43f5e', label: 'Entertainment' },
  { name: 'shopping', color: '#f97316', label: 'Shopping' },
  { name: 'finance', color: '#14b8a6', label: 'Finance' },
  { name: 'uncategorized', color: '#737373', label: 'Uncategorized' },
] as const;

export type CategoryName = typeof CATEGORIES[number]['name'];
