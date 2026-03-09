import type { RefObject } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface ScrollProgressBarProps {
  scrollRef: RefObject<HTMLDivElement | null>;
}

export function ScrollProgressBar({ scrollRef }: ScrollProgressBarProps) {
  const { scrollYProgress } = useScroll({ container: scrollRef });
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <motion.div
      style={{ scaleX, transformOrigin: 'left' }}
      className="h-0.5 bg-accent-primary"
    />
  );
}
