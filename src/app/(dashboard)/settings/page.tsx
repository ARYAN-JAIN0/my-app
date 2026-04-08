export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6">
      <h1 className="font-headline text-5xl font-bold display-tight text-white">Settings</h1>
      <section className="rounded-xl bg-surface-container p-5 space-y-3">
        <p className="text-muted-foreground">Environment and integration settings are driven by server-side configuration.</p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
          <li>Configure AI provider env vars in <code>.env</code>.</li>
          <li>Connect Gmail from <code>/api/integrations/gmail/auth-url</code>.</li>
          <li>Update default user settings using <code>DEFAULT_USER_EMAIL</code> and <code>DEFAULT_USER_NAME</code>.</li>
        </ul>
      </section>
    </div>
  );
}
