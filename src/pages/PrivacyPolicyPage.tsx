import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

interface PrivacyPolicyPageProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-zinc-200 font-semibold text-sm">{title}</h3>
      <div className="text-zinc-400 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export function PrivacyPolicyPage({ open, onOpenChange }: PrivacyPolicyPageProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85dvh] bg-bg-surface overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-text-primary">Privacy Policy</SheetTitle>
          <SheetDescription className="sr-only">
            Privacy policy for CurlBro workout app
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4 pb-8 pt-2">
          <Section title="Overview">
            <p>
              CurlBro is a client-side web application. All workout data is stored
              locally in your browser using localStorage. No data is sent to external
              servers.
            </p>
          </Section>

          <Section title="Google Analytics">
            <p>
              We use Google Analytics to collect anonymized usage data (page views,
              feature usage). This helps improve CurlBro. Google Analytics uses cookies.
              You can opt out via browser settings or the{' '}
              <a
                href="https://tools.google.com/dlpage/gaoptout"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-primary underline"
              >
                Google Analytics opt-out browser add-on
              </a>
              .
            </p>
          </Section>

          <Section title="Google AdSense">
            <p>
              We use Google AdSense to display advertisements. AdSense may use cookies
              and web beacons to serve ads based on your browsing history. You can opt
              out of personalized advertising at{' '}
              <a
                href="https://adssettings.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-primary underline"
              >
                Google Ad Settings
              </a>
              .
            </p>
          </Section>

          <Section title="Cookies">
            <p>
              CurlBro itself does not set any first-party cookies. Third-party cookies
              may be set by Google Analytics and Google AdSense as described above.
            </p>
          </Section>

          <Section title="Children's Privacy">
            <p>
              CurlBro is not directed at children under 13. We do not knowingly collect
              personal information from children.
            </p>
          </Section>

          <Section title="Data Control">
            <p>
              All your data is stored locally. You can delete all CurlBro data at any
              time from Settings &gt; Clear All Data.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              For privacy questions, contact{' '}
              <a
                href="mailto:contact@simonelongo.com"
                className="text-accent-primary underline"
              >
                contact@simonelongo.com
              </a>
              .
            </p>
          </Section>

          <p className="text-zinc-500 text-xs">Last updated: March 2026</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
