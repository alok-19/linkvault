import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gradient-to-r from-muted/50 via-muted to-muted/50 rounded',
        className
      )}
    />
  );
}
