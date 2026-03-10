'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import type { AppUser } from '@/types';

interface NavbarProps {
  user: AppUser;
  minimalHome?: boolean;
}

function UserAvatarFallback() {
  return (
    <svg className="h-5 w-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.75 6.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.5 20.25a7.5 7.5 0 0115 0" />
    </svg>
  );
}

export default function Navbar({ user, minimalHome = false }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const displayName = user.name || [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email;
  const avatarAlt = displayName;

  const navAliases: Record<string, string[]> = {
    '/dashboard': [
      '/dashboard',
      '/user/dashboard',
      '/organizer/dashboard',
    ],
    '/admin/dashboard': ['/admin', '/admin/dashboard'],
    '/superadmin/dashboard': ['/superadmin', '/superadmin/dashboard'],
    '/events/create': ['/events/create'],
    '/organizer/my-events': ['/organizer/my-events'],
    '/superadmin/analytics': ['/superadmin/analytics'],
    '/browse': ['/browse'],
  };

  const dashboardHref =
    user.role === 'SUPERADMIN'
      ? '/superadmin/dashboard'
      : user.role === 'ADMIN'
        ? '/admin/dashboard'
        : '/dashboard';

  const primaryNavItems = [
    { href: dashboardHref, label: 'Dashboard', show: true },
    {
      href: '/events/create',
      label: 'Create Event',
      show: (user.role === 'ORGANIZER' && user.status === 'ACTIVE') || user.role === 'SUPERADMIN',
    },
    { href: '/organizer/my-events', label: 'My Events', show: user.role === 'ORGANIZER' || user.role === 'SUPERADMIN' },
    { href: '/superadmin/analytics', label: 'Analytics', show: user.role === 'SUPERADMIN' },
  ];
  const canViewProfile = user.role !== 'ADMIN' && user.role !== 'SUPERADMIN';
  const canExploreEvents = user.role !== 'ADMIN' && user.role !== 'SUPERADMIN';

  const isActive = (href: string) => {
    const aliases = navAliases[href] ?? [href];
    return aliases.some(
      (path) => pathname === path || (pathname ? pathname.startsWith(`${path}/`) : false)
    );
  };
  const getNavLinkClass = (href: string) => {
    const baseClass = "text-sm font-medium transition";
    return isActive(href) 
      ? `${baseClass} text-neon font-semibold` 
      : `${baseClass} text-muted hover:text-white`;
  };

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
      });
      if (response.ok) {
        // Hard reload to ensure server-rendered auth state is cleared
        window.location.href = '/';
      } else {
        console.error('Logout failed with status:', response.status);
        alert('Logout failed. Please try again.');
      }
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Logout failed. Please try again.');
    }
  };

  return (
    <header className="sticky top-4 z-40">
      <div className="mx-auto w-full max-w-7xl px-6">
        <div className="relative flex items-center justify-between rounded-2xl border border-white/10 bg-black/70 px-7 py-3.5 shadow-[0_20px_60px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.18),inset_1px_0_0_rgba(255,255,255,0.12),inset_-1px_0_0_rgba(255,255,255,0.12)] backdrop-blur">
          <div className="flex items-center gap-6">
            {/* Logo */}
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

            {!minimalHome && (
              <nav className="hidden items-center gap-5 md:flex">
                {primaryNavItems.filter((item) => item.show).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={getNavLinkClass(item.href)}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          {/* Right Side Nav */}
          <div className="flex items-center gap-6">
            {!minimalHome && canExploreEvents && (
              <Link
                href="/browse"
                className={`hidden md:inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition ${
                  isActive('/browse')
                    ? 'border-white/50 bg-white/10'
                    : 'border-white/20 hover:border-white/40'
                }`}
              >
                <span className="bg-gradient-to-r from-pink-400 via-red-500 to-orange-400 bg-clip-text text-transparent">Explore Events</span>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H9M17 7v8" />
                </svg>
              </Link>
            )}
            {/* Hamburger for mobile */}
            {!minimalHome && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg border border-white/20 text-white hover:bg-white/10 transition"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileMenuOpen ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            )}
            {/* User Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black text-sm font-semibold text-white transition hover:bg-white/10 overflow-hidden"
              >
                {user.profileImage ? (
                  <Image
                    src={user.profileImage}
                    alt={avatarAlt}
                    width={36}
                    height={36}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserAvatarFallback />
                )}
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-white/10 bg-black shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur">
                  {/* User Info */}
                  <div className="flex items-center gap-3 border-b border-white/10 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black text-sm font-semibold text-white overflow-hidden">
                      {user.profileImage ? (
                        <Image
                          src={user.profileImage}
                          alt={avatarAlt}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserAvatarFallback />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-muted truncate">{user.email}</p>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-2">
                    {canViewProfile && (
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white hover:bg-white/10 transition"
                        onClick={() => setDropdownOpen(false)}
                      >
                        View Profile
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white hover:bg-white/10 transition text-left"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && !minimalHome && (
            <div className="md:hidden absolute left-0 right-0 top-full mt-2 rounded-2xl border border-white/10 bg-black/90 px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur flex flex-col gap-1">
              {primaryNavItems.filter((item) => item.show).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${getNavLinkClass(item.href)} py-2 px-2 rounded-lg hover:bg-white/5`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              {canExploreEvents && (
                <Link
                  href="/browse"
                  className={`${getNavLinkClass('/browse')} py-2 px-2 rounded-lg hover:bg-white/5`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Explore Events
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
