interface DragGhostOverlayProps {
  active: boolean;
  borderRadius?: string;
  children: React.ReactNode;
}

/**
 * Wraps children with a dashed-border ghost overlay when the element
 * is the source of an active drag operation.
 */
export function DragGhostOverlay({
  active,
  borderRadius = 'rounded-xl',
  children,
}: DragGhostOverlayProps) {
  if (!active) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div
        className={`absolute inset-0 ${borderRadius} border-2 border-dashed border-border-subtle bg-bg-surface/30 z-10 pointer-events-none`}
      />
      <div className="opacity-0 transition-opacity duration-150">
        {children}
      </div>
    </div>
  );
}
