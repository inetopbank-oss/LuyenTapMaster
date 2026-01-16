import React, { useEffect, useRef } from 'react';

interface MathTextProps {
  content: string;
  className?: string;
  block?: boolean;
}

declare global {
  interface Window {
    MathJax: any;
  }
}

const MathText: React.FC<MathTextProps> = ({ content, className = '', block = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    // 1. Immediately set the raw HTML content so text is visible even if MathJax fails
    element.innerHTML = content || '';

    // 2. Define the typesetting function
    const typeset = () => {
      if (window.MathJax && window.MathJax.typesetPromise) {
        // Clear any internal MathJax markers if necessary
        window.MathJax.typesetPromise([element])
          .catch((err: any) => {
            // Ignore "Promise was interrupted" errors which happen when navigating quickly
            if (!err.message?.includes('interrupted')) {
                console.warn('MathJax processing error:', err);
            }
          });
      }
    };

    // 3. Check availability and execute
    // CRITICAL FIX: Check for 'typesetPromise' to ensure the library is actually loaded, 
    // not just the configuration object (which is always present in index.html).
    if (window.MathJax && window.MathJax.typesetPromise) {
      typeset();
    } else {
      // If MathJax hasn't loaded yet (e.g., hard refresh), poll for it
      const checkInterval = setInterval(() => {
        if (window.MathJax && window.MathJax.typesetPromise) {
          clearInterval(checkInterval);
          typeset();
        }
      }, 100); // Check every 100ms

      // Cleanup interval if component unmounts before MathJax loads
      return () => clearInterval(checkInterval);
    }
  }, [content]);

  const Tag = block ? 'div' : 'span';

  return (
    <Tag 
      ref={containerRef} 
      className={`math-content ${className}`}
      style={{ visibility: 'visible' }} // Ensure visibility
    />
  );
};

export default React.memo(MathText);