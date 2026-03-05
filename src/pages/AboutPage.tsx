import { Info, ExternalLink, Mail, Bug } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

interface AboutPageProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const APP_VERSION = '0.0.0';

export function AboutPage({ open, onOpenChange }: AboutPageProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[60dvh] bg-bg-surface overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-text-primary">About</SheetTitle>
          <SheetDescription className="sr-only">
            About CurlBro workout app
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4 pb-8 pt-2">
          {/* App identity */}
          <div className="flex items-center gap-2">
            <Info size={20} className="text-accent-primary flex-shrink-0" />
            <div>
              <h2 className="text-lg font-bold text-text-primary">
                CurlBro{' '}
                <span className="text-sm font-normal text-text-tertiary">
                  v{APP_VERSION}
                </span>
              </h2>
            </div>
          </div>

          <p className="text-zinc-400 text-sm leading-relaxed">
            Science-backed workout builder with 201 exercises, smart conflict
            detection, and gap analysis for balanced training.
          </p>

          {/* Links */}
          <div className="flex flex-col gap-3">
            <a
              href="https://simonelongo.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-elevated p-3 min-h-[44px] active:bg-bg-surface transition-colors"
              aria-label="Visit Simone Longo's website"
            >
              <ExternalLink size={16} className="text-accent-primary flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-text-primary">Built by Simone Longo</div>
                <div className="text-xs text-text-tertiary">simonelongo.com</div>
              </div>
            </a>

            <a
              href="mailto:contact@simonelongo.com"
              className="flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-elevated p-3 min-h-[44px] active:bg-bg-surface transition-colors"
              aria-label="Send email to contact@simonelongo.com"
            >
              <Mail size={16} className="text-accent-primary flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-text-primary">Contact</div>
                <div className="text-xs text-text-tertiary">contact@simonelongo.com</div>
              </div>
            </a>

            <a
              href="https://github.com/SpacemanSpiff7/CurlBro/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-elevated p-3 min-h-[44px] active:bg-bg-surface transition-colors"
              aria-label="Report issues on GitHub"
            >
              <Bug size={16} className="text-accent-primary flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-text-primary">Report Issues</div>
                <div className="text-xs text-text-tertiary">GitHub Issues</div>
              </div>
            </a>
          </div>

          {/* Tech stack */}
          <div className="text-xs text-text-tertiary text-center pt-2">
            React &middot; TypeScript &middot; Tailwind CSS &middot; Vite
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
