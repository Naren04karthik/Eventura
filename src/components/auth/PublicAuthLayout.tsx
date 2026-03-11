import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/layout/Footer';
import { cn } from '@/lib/utils';

interface HeaderAction {
  href: string;
  label: string;
  active?: boolean;
}

interface PublicAuthLayoutProps {
  children: ReactNode;
  headerActions: HeaderAction[];
  centerContent?: ReactNode;
  mainClassName?: string;
  contentClassName?: string;
}

export default function PublicAuthLayout({
  children,
  headerActions,
  centerContent,
  mainClassName,
  contentClassName,
}: PublicAuthLayoutProps) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-ink text-white flex flex-col">
      {/* keep the public auth pages on one header/footer so they stop drifting */}
      <header className="sticky top-4 z-40">
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="relative flex items-center justify-between rounded-2xl border border-white/10 bg-black/70 px-7 py-3.5 shadow-[0_20px_60px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.18),inset_1px_0_0_rgba(255,255,255,0.12),inset_-1px_0_0_rgba(255,255,255,0.12)] backdrop-blur">
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
            {centerContent && (
              <div className="absolute left-1/2 hidden -translate-x-1/2 items-center md:flex">
                {centerContent}
              </div>
            )}
            <div className="flex items-center gap-3">
              {headerActions.map((action) => (
                <Link
                  key={`${action.href}-${action.label}`}
                  href={action.href}
                  className={cn(
                    'rounded-full border-thin px-4 py-2 text-sm transition hover:text-white hover:shadow-[0_0_0_1px_rgba(255,255,255,0.9)]',
                    action.active ? 'bg-white/10 text-white' : 'text-muted'
                  )}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className={cn('flex-1 flex items-center justify-center px-6 py-16', mainClassName)}>
        <div className={cn('w-full max-w-md', contentClassName)}>{children}</div>
      </main>

      <Footer />
    </div>
  );
}