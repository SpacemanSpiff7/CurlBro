import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

interface TermsOfUsePageProps {
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

export function TermsOfUsePage({ open, onOpenChange }: TermsOfUsePageProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85dvh] bg-bg-surface overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-text-primary">Terms of Use</SheetTitle>
          <SheetDescription className="sr-only">
            Terms of use for CurlBro workout app
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4 pb-8 pt-2">
          <Section title="Acceptance of Terms">
            <p>
              By accessing or using CurlBro (&quot;the App&quot;), you agree to be bound by
              these Terms of Use. If you do not agree, please do not use the App.
            </p>
          </Section>

          <Section title="Description of Service">
            <p>
              CurlBro is a free, client-side web application for building and tracking
              gym workouts. The App runs primarily in your browser and no account creation
              is required. Workout data is stored locally on your device using browser
              storage. If you voluntarily submit information through the Join Our List
              form or contact CurlBro, that information may be sent to external servers
              or service providers as described in the Privacy Policy.
            </p>
          </Section>

          <Section title="Use at Your Own Risk">
            <p>
              The exercise information, workout templates, and training suggestions
              provided by CurlBro are for general informational purposes only and do not
              constitute medical or professional fitness advice. Always consult a
              qualified healthcare provider or certified fitness professional before
              starting any exercise program, especially if you have pre-existing health
              conditions, injuries, or other medical concerns.
            </p>
            <p className="mt-2">
              You use the App and perform any exercises at your own risk. The developer
              is not liable for any injury, health issue, or damage resulting from your
              use of the App.
            </p>
          </Section>

          <Section title="Intellectual Property">
            <p>
              All content, design, and code comprising CurlBro are the property of the
              developer. You may use the App for personal, non-commercial purposes. You
              may not copy, modify, distribute, or create derivative works from the App
              without prior written permission.
            </p>
          </Section>

          <Section title="Advertisements">
            <p>
              CurlBro may display advertisements provided by third-party ad networks,
              including Google AdSense. These ads may use cookies and tracking
              technologies subject to the respective provider&apos;s policies. You can
              manage your ad preferences through our cookie consent controls and the{' '}
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

          <Section title="Data and Storage">
            <p>
              All data you create (workouts, logs, settings) is stored locally in your
              browser. Clearing your browser data or using the &quot;Clear All Data&quot;
              option in Settings will permanently delete this data. Information you submit
              through Join Our List is stored separately and may remain until deleted
              under the Privacy Policy. The developer is not responsible for any data loss.
            </p>
          </Section>

          <Section title="Disclaimer of Warranties">
            <p>
              The App is provided &quot;as is&quot; and &quot;as available&quot; without
              warranties of any kind, either express or implied. The developer does not
              warrant that the App will be uninterrupted, error-free, or free of harmful
              components.
            </p>
          </Section>

          <Section title="Limitation of Liability">
            <p>
              To the fullest extent permitted by law, the developer shall not be liable
              for any indirect, incidental, special, consequential, or punitive damages
              arising from your use of or inability to use the App.
            </p>
          </Section>

          <Section title="Changes to Terms">
            <p>
              These terms may be updated from time to time. Continued use of the App
              after changes constitutes acceptance of the revised terms.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              For questions about these terms, contact{' '}
              <a
                href="mailto:contact@curlbro.com"
                className="text-accent-primary underline"
              >
                contact@curlbro.com
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
