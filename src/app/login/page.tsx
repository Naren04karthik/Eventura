'use client';

import { useState } from 'react';
import Link from 'next/link';
import PublicAuthLayout from '@/components/auth/PublicAuthLayout';
import AuthCard from '@/components/auth/AuthCard';
import AuthField from '@/components/auth/AuthField';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const role = data?.data?.user?.role;
        const status = data?.data?.user?.status;

        let target = '/user/dashboard';

        if (role === 'ADMIN') {
          target = '/admin/dashboard';
        } else if (role === 'SUPERADMIN') {
          target = '/superadmin/dashboard';
        } else if (role === 'ORGANIZER') {
          if (status === 'PENDING') {
            target = '/waiting-for-approval';
          } else if (status === 'REJECTED' || status === 'SUSPENDED') {
            target = '/request-rejected';
          } else {
            target = '/organizer/dashboard';
          }
        }

        // Don't set loading to false - stay in loading state while redirecting
        window.location.href = target;
        return; // Exit early to prevent finally block
      } else {
        console.error('Login failed:', data);
        setError(data.message || data.error || 'Login failed');
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <PublicAuthLayout
      headerActions={[
        { href: '/login', label: 'Sign In', active: true },
        { href: '/register', label: 'Register' },
      ]}
    >
      <AuthCard>
            <div className="text-center mb-8">
              <h1 className="mt-3 text-3xl font-normal bg-gradient-to-r from-pink-400 via-red-500 to-orange-400 bg-clip-text text-transparent">
                Sign in to Eventura
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <AuthField
                id="email"
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your college mail id"
                required
              />

              <AuthField
                id="password"
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 rounded-full border border-neon bg-black text-neon font-medium transition hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-muted">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-neon hover:underline">
                Create one
              </Link>
            </div>
      </AuthCard>
    </PublicAuthLayout>
  );
}
