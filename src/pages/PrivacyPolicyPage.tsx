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
              CurlBro is an offline-first workout tracker. Your workout data stays on
              your device and is never transmitted to our servers. This policy covers
              both the CurlBro web app (curlbro.com) and the CurlBro iOS app.
            </p>
          </Section>

          <Section title="iOS App — What We Collect">
            <p>
              The CurlBro iOS app stores all workout logs, exercises, sets, and
              settings locally on your device using Apple&apos;s SwiftData framework.
              By default, no data leaves your device.
            </p>
            <p className="mt-2">
              The app does not include analytics, advertising SDKs, crash reporters,
              or any third-party data collection libraries. Data is transmitted to a
              non-Apple server only when you explicitly opt into the optional Cloud AI
              feature described below.
            </p>
          </Section>

          <Section title="iOS App — Apple Health (HealthKit)">
            <p>
              With your permission, CurlBro may read your body weight from Apple Health
              to improve calorie estimates for completed workouts, and may write completed
              strength workout summaries (duration and estimated calories) back to Apple
              Health. This data is exchanged directly between the app and HealthKit on
              your device — it is never sent to CurlBro servers. You can revoke these
              permissions at any time in iOS Settings &gt; Privacy &amp; Security &gt;
              Health.
            </p>
          </Section>

          <Section title="iOS App — On-Device AI (Apple Intelligence)">
            <p>
              On supported devices running iOS 26 or later with Apple Intelligence
              enabled, CurlBro may use Apple&apos;s on-device Foundation Models to
              generate workout plans and exercise notes. All inference runs entirely
              on your device. No prompts or results are sent to CurlBro or Apple servers.
            </p>
          </Section>

          <Section title="iOS App — Optional Cloud AI (Claude API)">
            <p>
              CurlBro includes an optional Cloud AI feature that uses Anthropic&apos;s
              Claude API to generate workout plans. This feature is OFF by default and
              requires you to (1) tick an in-app data-policy agreement in Settings, and
              (2) supply your own Anthropic API key. The key is stored in your
              device&apos;s Keychain — it is never synced to iCloud and never sent to
              CurlBro servers.
            </p>
            <p className="mt-2">
              When enabled, each workout build sends the following from your device
              directly to <code className="text-zinc-300">api.anthropic.com</code>:
            </p>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>Your quiz answers (split, training goal, fatigue level, sore muscles, superset / warmup / cooldown / finisher preferences)</li>
              <li>Your profile name, if you have set one</li>
              <li>The last 14 days of your workout history — absolute dates, total sets per session, and muscle groups trained per session</li>
              <li>The candidate exercise pool the rules engine selected for this build — exercise IDs, names, primary muscles, and equipment requirements</li>
            </ul>
            <p className="mt-2">
              No HealthKit data, body weight, or personally identifying information
              beyond an optional profile name is transmitted. Traffic does not pass
              through CurlBro servers. Anthropic&apos;s privacy policy applies to that
              traffic — see{' '}
              <a
                href="https://www.anthropic.com/legal/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-primary underline"
              >
                anthropic.com/legal/privacy
              </a>
              .
            </p>
            <p className="mt-2">
              You can disable Cloud AI at any time in Settings &gt; Cloud AI; turning
              it off deletes the API key from your device&apos;s Keychain.
            </p>
          </Section>

          <Section title="iOS App — Deleting Your Data">
            <p>
              You can delete all workout history from within the app, or uninstall
              CurlBro to remove all locally stored data. HealthKit data written by the
              app can be deleted from the Apple Health app.
            </p>
          </Section>

          <Section title="Web App — What We Collect">
            <p>
              The CurlBro web app (curlbro.com) stores workout data locally in your
              browser using localStorage. If you use the Join Our List form or otherwise
              contact us, we collect the information you submit and certain technical
              metadata (submission time, referrer, browser language, security signals)
              needed to operate and improve the service.
            </p>
          </Section>

          <Section title="Web App — How We Use Submitted Information">
            <p>
              We may use submitted information to send product updates, launch news,
              and service messages; to improve CurlBro; to prevent spam or abuse; to
              comply with legal obligations; and to operate or evolve the business.
              We do not sell personal information. We may share it with service providers
              that help us operate CurlBro.
            </p>
          </Section>

          <Section title="Web App — Third-Party Services">
            <p>
              The web app uses Google Analytics (anonymized usage data) and may use
              Google AdSense (interest-based ads). These services use cookies. You can
              opt out via{' '}
              <a
                href="https://tools.google.com/dlpage/gaoptout"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-primary underline"
              >
                Google&apos;s opt-out tools
              </a>
              . The iOS app does not use any of these services.
            </p>
          </Section>

          <Section title="Affiliate Links">
            <p>
              CurlBro may contain affiliate links to third-party products or services. If
              you make a purchase through one of these links, CurlBro may earn a commission
              at no additional cost to you. Affiliate relationships do not influence which
              products or exercises we feature. Affiliate links are disclosed at the point
              of recommendation.
            </p>
          </Section>

          <Section title="Children's Privacy">
            <p>
              CurlBro is not directed at children under 13. We do not knowingly collect
              personal information from children.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              For privacy questions, contact{' '}
              <a
                href="mailto:contact@curlbro.com"
                className="text-accent-primary underline"
              >
                contact@curlbro.com
              </a>
              .
            </p>
          </Section>

          <p className="text-zinc-500 text-xs">Last updated: April 2026</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
