import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CATEGORIES } from '@/types';
import { CollectionView } from '@/components/collection/CollectionView';

interface Props {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: categoryParam } = await params;
  const category = decodeURIComponent(categoryParam);
  const cat = CATEGORIES.find(c => c.name === category);

  if (!cat) {
    return { title: 'Collection Not Found' };
  }

  const ogImageUrl = `/api/collections/${encodeURIComponent(category)}/og`;

  return {
    title: `${cat.label} — LinkVault Collection`,
    description: `Browse ${cat.label} links curated on LinkVault`,
    openGraph: {
      title: `${cat.label} — LinkVault Collection`,
      description: `Browse ${cat.label} links curated on LinkVault`,
      type: 'website',
      images: [ogImageUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${cat.label} — LinkVault Collection`,
      description: `Browse ${cat.label} links curated on LinkVault`,
      images: [ogImageUrl],
    },
  };
}

export default async function CollectionPage({ params }: Props) {
  const { category: categoryParam } = await params;
  const category = decodeURIComponent(categoryParam);
  const validCategory = CATEGORIES.find(c => c.name === category);

  if (!validCategory) {
    notFound();
  }

  return <CollectionView category={category} categoryLabel={validCategory.label} categoryColor={validCategory.color} />;
}
