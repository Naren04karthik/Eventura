'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/auth-context';
import type { AdminRequest, AdminUser } from '@/types';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'requests' | 'users'>('requests');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 4000);
    return () => window.clearTimeout(timer);
  }, [message]);

  const checkAuth = async () => {
    try {
      if (!user || user.role !== 'SUPERADMIN') {
        router.push('/dashboard');
        return;
      }

      await Promise.all([fetchRequests(), fetchAdminUsers()]);
    } catch (error) {
      console.error('Failed to check auth:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/admin/requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setAdminUsers(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch admin users:', error);
    }
  };

  const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
    setProcessing(requestId);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });

      const data = await response.json();

      if (response.ok) {
        if (action === 'approve') {
          setMessage({
            type: 'success',
            text: 'Admin account approved! The admin has been notified by email.',
          });
          await fetchAdminUsers();
        } else {
          setMessage({
            type: 'success',
            text: 'Request rejected successfully',
          });
        }
        await fetchRequests();
      } else {
        setMessage({
          type: 'error',
          text: data.message || `Failed to ${action} request`,
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Something went wrong`,
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink text-white flex flex-col">
      {/* Header */}
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
              <span className="text-xs uppercase tracking-[0.2em] text-neon">SUPERADMIN</span>
              <button
                onClick={handleLogout}
                className="rounded-full border-thin px-4 py-2 text-sm text-muted transition hover:text-white hover:shadow-[0_0_0_1px_rgba(255,255,255,0.9)]"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
        {/* Message Alert */}
        {message && (
          <div
            className={`mb-6 rounded-2xl border p-4 ${
              message.type === 'success'
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('requests')}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === 'requests'
                  ? 'bg-white/10 text-white'
                  : 'text-muted hover:bg-white/5 hover:text-white'
              }`}
            >
              Pending Requests ({requests.length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === 'users'
                  ? 'bg-white/10 text-white'
                  : 'text-muted hover:bg-white/5 hover:text-white'
              }`}
            >
              Admin Users ({adminUsers.length})
            </button>
          </div>
        </div>

        {/* Requests List */}
        {activeTab === 'requests' && (
          <div className="rounded-3xl border-strong bg-black p-8">
            <h2 className="text-xl font-normal mb-6">Pending Admin Requests</h2>

            {requests.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted">No pending requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-2xl bg-black/40 border border-white/5 p-6 hover:border-white/10 transition"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-normal">{request.firstName}</h3>
                          <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 rounded-full px-3 py-1">
                            {request.collegeName}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-muted">
                          <p>📧 {request.email}</p>
                          <p className="text-xs text-soft">
                            Requested {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(request.id, 'approve')}
                          disabled={processing === request.id}
                          className="rounded-full bg-green-500/20 border border-green-500/50 px-4 py-2 text-sm text-green-400 transition hover:bg-green-500/30 disabled:opacity-50"
                        >
                          {processing === request.id ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleAction(request.id, 'reject')}
                          disabled={processing === request.id}
                          className="rounded-full bg-red-500/20 border border-red-500/50 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/30 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Admin Users List */}
        {activeTab === 'users' && (
          <div className="rounded-3xl border-strong bg-black p-8">
            <h2 className="text-xl font-normal mb-6">Admin Users</h2>

            {adminUsers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted">No admin users yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-4 px-4 text-sm font-medium text-soft uppercase tracking-[0.1em]">Name</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-soft uppercase tracking-[0.1em]">Email</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-soft uppercase tracking-[0.1em]">College</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-soft uppercase tracking-[0.1em]">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map((admin) => (
                      <tr 
                        key={admin.id}
                        className="border-b border-white/5 hover:bg-white/5 transition"
                      >
                        <td className="py-4 px-4 text-sm">
                          <span className="font-medium">{admin.firstName} {admin.lastName}</span>
                        </td>
                        <td className="py-4 px-4 text-sm text-muted">
                          {admin.email}
                        </td>
                        <td className="py-4 px-4 text-sm text-muted">
                          {admin.college?.name || '-'}
                        </td>
                        <td className="py-4 px-4 text-sm text-soft">
                          {new Date(admin.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
