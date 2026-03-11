'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PublicAuthLayout from '@/components/auth/PublicAuthLayout';
import AuthCard from '@/components/auth/AuthCard';
import AuthField from '@/components/auth/AuthField';

export default function SuperadminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/superadmin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        router.push('/superadmin/dashboard');
      } else {
        const data = await response.json();
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicAuthLayout headerActions={[{ href: '/login', label: 'Regular Login' }]}>
      <AuthCard>
            <div className="text-center mb-8">
              <p className="text-xs uppercase tracking-[0.3em] text-soft">Restricted Access</p>
              <h1 className="mt-3 text-3xl font-normal">Superadmin Login</h1>
              <p className="mt-3 text-sm text-muted">
                Use the configured superadmin email and password
              </p>
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
                className="w-full py-3 px-6 rounded-full border-strong bg-white/10 text-white font-medium transition hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign in as Superadmin'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/login" className="text-sm text-neon hover:underline">
                ← Back to regular login
              </Link>
            </div>
      </AuthCard>
    </PublicAuthLayout>
  );
}
