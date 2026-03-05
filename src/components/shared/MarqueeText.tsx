import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface MarqueeTextProps {
  text: string;
  className?: string;
}

export function MarqueeText({ text, className = '' }: MarqueeTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    const textEl = textRef.current;
    if (!container || !textEl) return;

    const observer = new ResizeObserver(() => {
      const diff = textEl.scrollWidth - container.clientWidth;
      setOverflow(diff > 2 ? diff : 0);
    });
    observer.observe(container);
    observer.observe(textEl);
    return () => observer.disconnect();
  }, [text]);

  return (
    <div ref={containerRef} className={`overflow-hidden ${className}`}>
      <motion.span
        ref={textRef}
        className="inline-block whitespace-nowrap"
        animate={
          overflow > 0
            ? { x: [0, -overflow, 0] }
            : { x: 0 }
        }
        transition={
          overflow > 0
            ? {
                duration: Math.max(3, overflow / 20),
                repeat: Infinity,
                repeatDelay: 1.5,
                ease: 'linear',
              }
            : undefined
        }
        key={overflow > 0 ? 'scrolling' : 'static'}
      >
        {text}
      </motion.span>
    </div>
  );
}
