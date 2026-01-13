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
    if (containerRef.current && window.MathJax) {
      // Clear previous content and set new content
      containerRef.current.innerHTML = content;
      
      // Tell MathJax to process the new content
      window.MathJax.typesetPromise([containerRef.current])
        .catch((err: any) => console.error('MathJax typeset failed:', err));
    }
  }, [content]);

  const Tag = block ? 'div' : 'span';

  return (
    <Tag 
      ref={containerRef} 
      className={`math-content ${className}`}
    />
  );
};

export default React.memo(MathText);