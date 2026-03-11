'use client';

import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/auth-context';

export default function Home() {
  const { user } = useAuth();

  const handleBrowseEvents = () => {
    if (!user) {
      window.alert('You must be logged in');
      return;
    }

    window.location.href = '/browse';
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-ink text-white">
      {/* Show authenticated navbar or public navbar */}
      {user ? (
          <>
            <Navbar user={user} minimalHome />
            {!user.isProfileComplete && 
             (user.role !== 'ORGANIZER' || user.status === 'ACTIVE') && (
              <div className="mx-auto w-full max-w-7xl px-6 mt-6">
                <div className="rounded-xl bg-gradient-to-r from-neon/10 via-neon/5 to-transparent border border-neon/30 p-5 flex items-center gap-4 shadow-[0_0_20px_rgba(0,255,136,0.1)]">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-neon/20 border border-neon/50">
                    <svg className="w-6 h-6 text-neon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white mb-1">Complete Your Profile</p>
                    <p className="text-sm text-muted">Add your details to unlock all features and get started</p>
                  </div>
                  <Link
                    href="/complete-profile"
                    className="px-5 py-2.5 rounded-lg bg-neon text-black font-semibold hover:bg-neon/90 transition-all hover:shadow-[0_0_20px_rgba(0,255,136,0.3)] text-sm whitespace-nowrap"
                  >
                    Complete Now
                  </Link>
                </div>
              </div>
            )}
          </>
        ) : (
          <header className="sticky top-4 z-40">
            <div className="mx-auto w-full max-w-7xl px-6">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/70 px-7 py-3.5 shadow-[0_20px_60px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.18),inset_1px_0_0_rgba(255,255,255,0.12),inset_-1px_0_0_rgba(255,255,255,0.12)] backdrop-blur">
                <Link href="/" className="flex items-center hover:opacity-80 transition" aria-label="Home">
                  <Image
                    src="/branding/logo_dark_no_bg..svg"
                    alt="Eventura"
                    width={144}
                    height={36}
                    className="h-9 w-auto"
                    priority
                  />
                </Link>
                <div className="flex items-center gap-3">
                  <Link
                    href="/login"
                    className="rounded-full border-thin px-4 py-2 text-sm text-muted transition hover:text-white hover:shadow-[0_0_0_1px_rgba(255,255,255,0.9)]"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-lg border-strong bg-white/10 px-4 py-2 text-sm text-white transition hover:shadow-[0_0_0_1px_rgba(255,255,255,0.9)]"
                  >
                    Register
                  </Link>
                </div>
              </div>
            </div>
          </header>
      )}

      <main>
        <section className="overflow-hidden">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-6 py-20 lg:flex-row lg:items-center">
            <div className="flex-1">
              <div className="text-xs uppercase tracking-[0.3em] text-soft">
                <span className="text-neon">Live</span>
                <span className="ml-3">Events in real time</span>
              </div>
              <h1 className="mt-6 text-4xl font-normal leading-tight sm:text-5xl">
                College Event Management.<br />
                <span className="bg-gradient-to-r from-pink-400 via-red-500 to-orange-400 bg-clip-text text-transparent">
                  Simplified.
                </span>
              </h1>
              <p className="mt-4 max-w-xl text-base text-muted">
                EVENTURA is a college management system which has multiple features like attendance, event tracking, event exploration and also an attendance system which uses qr codes
                and also has analytics of each event which is robust and we have layered role system for better management
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleBrowseEvents}
                  className="group relative overflow-hidden rounded-full bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 p-[2px] transition transform hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)]"
                >
                  <span className="flex items-center gap-2 rounded-full bg-black px-5 py-2 text-sm text-white transition">
                    Browse Events
                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
            <div className="flex-1">
              <Image
                src="/hero_no_bg.png"
                alt="Eventura platform preview"
                width={1200}
                height={900}
                priority
                className="h-auto w-full object-contain"
              />
            </div>
          </div>
        </section>

        <section id="contact" className="bg-ink">
          <div className="mx-auto w-full max-w-7xl px-6 py-16">
            <div className="rounded-3xl border-strong bg-black/40 p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-2xl font-normal">Need admin access for your college?</h3>
                  <p className="mt-3 text-sm text-muted">
                    Submit a request to become a college admin. Our SUPERADMIN team will review and approve.
                  </p>
                </div>
                <Link
                  href="/contact-admin"
                  className="rounded-full border-strong bg-white/10 px-6 py-3 text-sm text-white transition hover:bg-white/20"
                >
                  Request Admin Access
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
