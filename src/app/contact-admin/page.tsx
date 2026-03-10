'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PublicAuthLayout from '@/components/auth/PublicAuthLayout';
import AuthCard from '@/components/auth/AuthCard';
import AuthField from '@/components/auth/AuthField';

export default function ContactAdminPage() {
  const [formData, setFormData] = useState({
    collegeName: '',
    firstName: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!error && !success) return;
    const timer = window.setTimeout(() => {
      setError('');
      setSuccess(false);
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [error, success]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/contact/admin-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setFormData({ collegeName: '', firstName: '', email: '', password: '' });
      } else {
        setError(data.message || 'Failed to submit request');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicAuthLayout
      headerActions={[
        { href: '/login', label: 'Sign In' },
        { href: '/register', label: 'Register' },
      ]}
    >
      <AuthCard>
            {success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/20 border border-green-500/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-normal mb-3">Request Submitted</h2>
                <p className="text-muted mb-6">
                  Your admin request has been submitted successfully. You will receive an email once it's reviewed.
                </p>
                <button
                  onClick={() => setSuccess(false)}
                  className="rounded-full border-thin px-6 py-3 text-sm transition hover:bg-white/10"
                >
                  Submit Another Request
                </button>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h1 className="mt-3 text-3xl font-normal bg-gradient-to-r from-pink-400 via-red-500 to-orange-400 bg-clip-text text-transparent">
                    Become a college admin
                  </h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <AuthField
                  id="collegeName"
                  name="collegeName"
                  label="College Name *"
                  value={formData.collegeName}
                  onChange={handleChange}
                  placeholder="Your college name"
                  required
                />

                <AuthField
                  id="firstName"
                  name="firstName"
                  label="Your First Name *"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Harsith"
                  required
                />

                <AuthField
                  id="email"
                  name="email"
                  label="Official Email Address *"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your college mail id"
                  required
                />

                <AuthField
                  id="password"
                  name="password"
                  label="Password *"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-6 rounded-full border border-neon bg-black text-neon font-medium transition hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>

                <div className="mt-6 text-center text-sm text-muted">
                  Already have an account?{' '}
                  <Link href="/login" className="text-neon hover:underline">
                    Sign in
                  </Link>
                </div>
                </form>
              </>
            )}
      </AuthCard>
    </PublicAuthLayout>
  );
}
