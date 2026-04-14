export function PrivacyPolicyStandalone() {
  return (
    <div className="min-h-dvh bg-bg-root text-text-primary">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-bg-root/90 backdrop-blur border-b border-border-subtle">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <a
            href="/"
            className="flex items-center gap-2 text-text-primary font-bold text-[17px] tracking-tight no-underline"
          >
            <img
              src="/icon-192x192.png"
              alt="CurlBro"
              className="w-7 h-7 rounded-md"
            />
            CurlBro
          </a>
          <a
            href="/"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            ← Back to app
          </a>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-6 py-12 pb-20">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-text-tertiary text-sm mb-12">Last updated: March 2026</p>

        <div className="flex flex-col gap-8">
          <Section title="Overview">
            <p>
              CurlBro stores workout data locally on your device. If you use the Join Our List
              form or otherwise contact us, we also collect and store the information you submit
              and certain technical metadata needed to operate, protect, and improve the service.
              We use third-party services as described below.
            </p>
          </Section>

          <Section title="Join Our List and Contact Data">
            <p>
              If you submit the Join Our List form, we may collect your first name, last name,
              email address, phone number, training preferences, free-form responses, and other
              information you choose to provide. We may also collect related metadata such as
              submission time, source page, referrer or campaign tags, browser language, coarse
              location, and security or abuse-prevention signals.
            </p>
            <p className="mt-3">
              This information is controlled by CurlBro and treated as part of the business's
              data assets, subject to this policy and applicable law. We use reasonable measures
              and will do our best to protect it, but no method of transmission or storage is
              completely secure.
            </p>
          </Section>

          <Section title="How We Use Submitted Information">
            <p>
              We may use submitted information to send product updates, launch news, service
              messages, improve CurlBro, understand audience interest, prevent spam or abuse,
              comply with legal obligations, and operate or evolve the business.
            </p>
          </Section>

          <Section title="Phone Numbers">
            <p>
              If you voluntarily provide a phone number, we may retain it as part of your
              profile. Providing a phone number through the form does not by itself grant any
              marketing-text consent beyond what applicable law allows. If we later want to use
              phone numbers for marketing texts or similar outreach, we will obtain any
              additional consent required by law.
            </p>
          </Section>

          <Section title="Sale or Sharing of Personal Information">
            <p>
              We do not currently sell personal information. We may share information with
              service providers and infrastructure vendors that help us operate CurlBro. If our
              practices change and we begin selling or otherwise sharing personal information in
              ways that trigger legal notice or opt-out rights, we will update this policy and
              provide any notices or controls required by applicable law.
            </p>
          </Section>

          <Section title="Google Analytics">
            <p>
              We use Google Analytics to collect anonymized usage data (page views, feature
              usage). This helps improve CurlBro. Google Analytics uses cookies. You can opt
              out via browser settings or the{' '}
              <a
                href="https://tools.google.com/dlpage/gaoptout"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-primary underline underline-offset-2 hover:text-accent-hover transition-colors"
              >
                Google Analytics opt-out browser add-on
              </a>
              .
            </p>
          </Section>

          <Section title="Google AdSense">
            <p>
              We use Google AdSense to display advertisements. AdSense may use cookies and web
              beacons to serve ads based on your browsing history. You can opt out of
              personalized advertising at{' '}
              <a
                href="https://adssettings.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-primary underline underline-offset-2 hover:text-accent-hover transition-colors"
              >
                Google Ad Settings
              </a>
              .
            </p>
          </Section>

          <Section title="Cookies">
            <p>
              CurlBro itself does not currently rely on first-party cookies for workout storage.
              Third-party cookies may be set by Google Analytics and Google AdSense as described
              above.
            </p>
          </Section>

          <Section title="Children's Privacy">
            <p>
              CurlBro is not directed at children under 13. We do not knowingly collect personal
              information from children.
            </p>
          </Section>

          <Section title="Data Control">
            <p>
              You can delete local workout data at any time from Settings &gt; Clear All Data. To
              request deletion of information submitted through the Join Our List form, contact us
              at the email below.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              For privacy questions, contact{' '}
              <a
                href="mailto:contact@curlbro.com"
                className="text-accent-primary underline underline-offset-2 hover:text-accent-hover transition-colors"
              >
                contact@curlbro.com
              </a>
              .
            </p>
          </Section>
        </div>

        <footer className="mt-12 pt-8 border-t border-border-subtle text-text-tertiary text-xs flex flex-wrap gap-4 justify-between">
          <span>&copy; 2026 CurlBro</span>
          <nav className="flex gap-4">
            <a href="/" className="hover:text-accent-primary transition-colors">App</a>
            <a href="/guide/" className="hover:text-accent-primary transition-colors">User Guide</a>
            <a href="mailto:contact@curlbro.com" className="hover:text-accent-primary transition-colors">Contact</a>
          </nav>
        </footer>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pb-8 border-b border-border-subtle last:border-none last:pb-0">
      <h2 className="text-sm font-semibold text-text-primary mb-3">{title}</h2>
      <div className="text-text-secondary text-sm leading-relaxed">{children}</div>
    </div>
  );
}
