import { useEffect, useRef, useCallback } from 'react';

interface UseKeyboardProps {
  onSearchFocus?: () => void;
  onNewLink?: () => void;
  onNavigate?: (direction: 'up' | 'down') => void;
  onOpen?: () => void;
  onSelect?: () => void;
  onDelete?: () => void;
  onEscape?: () => void;
  onHelp?: () => void;
}

export function useKeyboard({
  onSearchFocus,
  onNewLink,
  onNavigate,
  onOpen,
  onSelect,
  onDelete,
  onEscape,
  onHelp,
}: UseKeyboardProps) {
  const selectedIndexRef = useRef(-1);
  const isHelpOpenRef = useRef(false);
  const isModalOpenRef = useRef(false);

  const setSelectedIndex = useCallback((index: number) => {
    selectedIndexRef.current = index;
  }, []);

  const setHelpOpen = useCallback((open: boolean) => {
    isHelpOpenRef.current = open;
  }, []);

  const setModalOpen = useCallback((open: boolean) => {
    isModalOpenRef.current = open;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      const isModal = isModalOpenRef.current || isHelpOpenRef.current;

      // Escape - always works
      if (e.key === 'Escape') {
        onEscape?.();
        return;
      }

      // ? - show help (not when typing)
      if (e.key === '?' && !isInput) {
        e.preventDefault();
        onHelp?.();
        return;
      }

      // Don't process other shortcuts when in input or modal
      if (isInput || isModal) return;

      switch (e.key) {
        case '/':
          e.preventDefault();
          onSearchFocus?.();
          break;
        case 'n':
          e.preventDefault();
          onNewLink?.();
          break;
        case 'j':
        case 'ArrowDown':
          e.preventDefault();
          onNavigate?.('down');
          break;
        case 'k':
        case 'ArrowUp':
          e.preventDefault();
          onNavigate?.('up');
          break;
        case 'Enter':
          onOpen?.();
          break;
        case 'x':
          onSelect?.();
          break;
        case 'd':
          e.preventDefault();
          onDelete?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSearchFocus, onNewLink, onNavigate, onOpen, onSelect, onDelete, onEscape, onHelp]);

  return { selectedIndexRef, setSelectedIndex, setHelpOpen, setModalOpen };
}
