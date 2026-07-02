import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export default function useFocusTrap(isActive, onEscape) {
  const containerRef = useRef(null);
  const previousFocusedElementRef = useRef(null);
  const onEscapeRef = useRef(onEscape);

  // Keep latest onEscape without re-running the focus trap effect
  useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!isActive) return;

    const container = containerRef.current;
    if (!container) return;

    previousFocusedElementRef.current = document.activeElement;

    function getFocusableElements() {
      return Array.from(container.querySelectorAll(FOCUSABLE_SELECTORS)).filter(
        (element) => {
          const isVisible =
            element.offsetWidth > 0 ||
            element.offsetHeight > 0 ||
            element.getClientRects().length > 0;

          const isDisabled =
            element.hasAttribute('disabled') ||
            element.getAttribute('aria-hidden') === 'true';

          return isVisible && !isDisabled;
        }
      );
    }

    function focusFirstElement() {
      const focusableElements = getFocusableElements();
      const firstElement = focusableElements[0];

      if (firstElement) {
        firstElement.focus({ preventScroll: true });
      } else {
        container.focus({ preventScroll: true });
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape' && onEscapeRef.current) {
        event.preventDefault();
        onEscapeRef.current();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();

      if (focusableElements.length === 0) {
        event.preventDefault();
        container.focus({ preventScroll: true });
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!container.contains(document.activeElement)) {
        event.preventDefault();
        firstElement.focus({ preventScroll: true });
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus({ preventScroll: true });
        return;
      }

      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus({ preventScroll: true });
      }
    }

    requestAnimationFrame(focusFirstElement);

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      const previousFocusedElement = previousFocusedElementRef.current;

      if (previousFocusedElement && previousFocusedElement.focus) {
        previousFocusedElement.focus({ preventScroll: true });
      }
    };
  }, [isActive]);

  return containerRef;
}