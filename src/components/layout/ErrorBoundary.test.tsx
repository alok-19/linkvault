import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';

// Component that throws
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Normal content</div>;
};

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Hello world</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders fallback UI when error occurs', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
