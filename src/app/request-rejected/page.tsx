'use client';

import Link from 'next/link';

export default function RequestRejectedPage() {
  return (
    <div className="min-h-screen bg-ink text-white flex items-center justify-center px-6">
      <div className="w-full max-w-lg glass card-glow rounded-3xl border-strong p-8 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-soft">Organizer Access</p>
        <h1 className="mt-4 text-3xl font-normal">Request not approved</h1>
        <p className="mt-4 text-sm text-muted">
          Your organizer request was not approved. If you believe this is a mistake, contact support.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/contact-admin"
            className="inline-flex rounded-full border-strong bg-white/10 px-6 py-2 text-sm transition hover:bg-white/20"
          >
            Contact admin
          </Link>
          <Link
            href="/"
            className="inline-flex rounded-full border-thin px-6 py-2 text-sm text-muted transition hover:text-white"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
