import { X, Mail, Github } from "lucide-react";

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Sign in"
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card text-card-foreground"
        style={{ boxShadow: "var(--shadow-panel)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold tracking-tight">Save your boards</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </header>

        <div className="space-y-3 p-5">
          <p className="text-sm text-muted-foreground">
            Sign in to sync boards across devices, collaborate with your team, and access version history.
          </p>

          <button
            type="button"
            disabled
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium disabled:opacity-70"
          >
            <GoogleIcon />
            Continue with Google
          </button>
          <button
            type="button"
            disabled
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium disabled:opacity-70"
          >
            <Github size={16} />
            Continue with GitHub
          </button>
          <button
            type="button"
            disabled
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium disabled:opacity-70"
          >
            <Mail size={16} />
            Continue with email
          </button>

          <p className="text-center text-xs text-muted-foreground">
            Providers coming soon — the auth layer is modular and ready to connect.
          </p>

          <div className="my-2 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            or
            <div className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg bg-foreground px-3 py-2.5 text-sm font-medium text-background hover:opacity-90"
          >
            Continue as guest
          </button>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M12 10v3.999h5.5c-.24 1.39-1.7 4.083-5.5 4.083-3.31 0-6-2.75-6-6.083S8.69 5.917 12 5.917c1.88 0 3.14.8 3.86 1.487l2.63-2.542C16.8 3.34 14.62 2.417 12 2.417c-5.29 0-9.58 4.29-9.58 9.582S6.71 21.583 12 21.583c5.53 0 9.19-3.89 9.19-9.37 0-.63-.07-1.11-.15-1.6H12z"/>
    </svg>
  );
}
