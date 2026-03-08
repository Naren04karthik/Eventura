'use client';

import Link from 'next/link';

export default function WaitingForApprovalPage() {
  return (
    <div className="min-h-screen bg-ink text-white flex items-center justify-center px-6">
      <div className="w-full max-w-lg glass card-glow rounded-3xl border-strong p-8 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-soft">Organizer Access</p>
        <h1 className="mt-4 text-3xl font-normal">Waiting for approval</h1>
        <p className="mt-4 text-sm text-muted">
          Your organizer request is under review. You will be notified once an admin approves it.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex rounded-full border-strong bg-white/10 px-6 py-2 text-sm transition hover:bg-white/20"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
