import { TopBar } from './TopBar';

interface PageLayoutProps {
  /** TopBar children (title, inputs) */
  header: React.ReactNode;
  /** TopBar rightSlot (action buttons) */
  headerRight?: React.ReactNode;
  /** Page content */
  children: React.ReactNode;
  /** Extra className on content container */
  contentClassName?: string;
}

export function PageLayout({ header, headerRight, children, contentClassName }: PageLayoutProps) {
  return (
    <div className="flex flex-col gap-4 pb-20">
      <div className="sticky top-0 z-20 bg-bg-root/80 backdrop-blur-sm">
        <TopBar rightSlot={headerRight}>{header}</TopBar>
      </div>
      <div className={contentClassName}>
        {children}
      </div>
    </div>
  );
}
