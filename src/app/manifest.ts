import type { MetadataRoute } from 'next';

export default function manifest() {
  return {
    name: 'LinkVault',
    short_name: 'LinkVault',
    description: 'The world\'s best visual link dashboard',
    start_url: '/',
    display: 'standalone',
    background_color: '#fafafa',
    theme_color: '#6366f1',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    categories: ['productivity', 'utilities'],
    shortcuts: [
      {
        name: 'Add Link',
        short_name: 'Add',
        description: 'Add a new link to your vault',
        url: '/?action=add',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
    ],
    share_target: {
      action: '/',
      method: 'GET',
      params: {
        title: 'title',
        text: 'text',
        url: 'url',
      },
    },
  } as MetadataRoute.Manifest;
}
