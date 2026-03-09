import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface GuideSectionProps {
  step: number;
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}

export function GuideSection({ step, icon: Icon, title, children }: GuideSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-3"
    >
      <div className="flex items-center gap-3">
        <motion.div
          initial={{ scale: 0.5 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ type: 'spring', stiffness: 400, damping: 25, delay: 0.15 }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-primary text-sm font-bold text-white"
        >
          {step}
        </motion.div>
        <Icon size={20} className="shrink-0 text-text-secondary" />
        <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      </div>
      <div className="ml-11 space-y-3">{children}</div>
    </motion.section>
  );
}
