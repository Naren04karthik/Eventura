'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/auth-context';

interface AnalyticsData {
  summary: {
    totalUsers: number;
    totalEvents: number;
    totalRegistrations: number;
    totalColleges: number;
  };
  usersByRole: Array<{ role: string; _count: { id: number } }>;
  usersByStatus: Array<{ status: string; _count: { id: number } }>;
  eventsByStatus: Array<{ status: string; _count: { id: number } }>;
  registrationsByStatus: Array<{ status: string; _count: { id: number } }>;
  topEvents: Array<{
    id: string;
    title: string;
    date: string;
    registrationCount: number;
  }>;
  recentRegistrations: Array<{
    id: string;
    userName: string;
    userEmail: string;
    eventTitle: string;
    status: string;
    registeredAt: string;
  }>;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
      if (user && user.role === 'SUPERADMIN') {
        await fetchAnalytics();
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data);
      } else {
        setMessage({ type: 'error', text: 'Failed to load analytics' });
      }
    } catch (error) {
      console.error('Analytics fetch error:', error);
      setMessage({ type: 'error', text: 'Error loading analytics' });
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const response = await fetch('/api/analytics/export');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `eventura-analytics-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setMessage({ type: 'success', text: 'Analytics exported successfully' });
      } else {
        setMessage({ type: 'error', text: 'Failed to export analytics' });
      }
    } catch (error) {
      console.error('Export error:', error);
      setMessage({ type: 'error', text: 'Error exporting analytics' });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Navigation */}
      <header className="fixed bottom-4 left-0 right-0 z-40">
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/90 px-7 py-3.5 backdrop-blur-xl shadow-lg">
            <Link href="/" className="flex items-center hover:opacity-80 transition" aria-label="Home">
              <Image
                src="/branding/logo_dark_no_bg..svg"
                alt="Eventura"
                width={144}
                height={36}
                className="h-9 w-auto"
              />
            </Link>
            <Link
              href="/superadmin/dashboard"
              className="text-sm hover:text-white/80 transition"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Analytics Dashboard</h1>
          <div className="flex gap-3">
            <button
              onClick={handleExportExcel}
              disabled={exporting}
              className="px-6 py-2 bg-neon text-black rounded-lg font-semibold hover:bg-neon/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {exporting ? 'Exporting...' : 'Export as Excel'}
            </button>
            <button
              onClick={() => fetchAnalytics()}
              className="px-6 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}
          >
            {message.text}
          </div>
        )}

        {analytics ? (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <p className="text-sm text-gray-400 mb-2">Total Users</p>
                <p className="text-3xl font-bold">{analytics.summary.totalUsers}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <p className="text-sm text-gray-400 mb-2">Total Events</p>
                <p className="text-3xl font-bold">{analytics.summary.totalEvents}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <p className="text-sm text-gray-400 mb-2">Total Registrations</p>
                <p className="text-3xl font-bold">{analytics.summary.totalRegistrations}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <p className="text-sm text-gray-400 mb-2">Total Colleges</p>
                <p className="text-3xl font-bold">{analytics.summary.totalColleges}</p>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Users by Role */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Users by Role</h2>
                <div className="space-y-3">
                  {analytics.usersByRole.map((item: any) => (
                    <div key={item.role} className="flex justify-between items-center">
                      <span className="text-gray-400">{item.role}</span>
                      <span className="font-semibold">{item._count.id}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Top Events */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Top 5 Events by Registrations</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4">Event Title</th>
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-right py-3 px-4">Registrations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topEvents.map((event: any) => (
                      <tr key={event.id} className="border-b border-white/5 hover:bg-white/5 transition">
                        <td className="py-3 px-4">{event.title}</td>
                        <td className="py-3 px-4 text-gray-400">
                          {new Date(event.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold">
                          {event.registrationCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Registrations */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Registrations (Last 10)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4">User</th>
                      <th className="text-left py-3 px-4">Email</th>
                      <th className="text-left py-3 px-4">Event</th>
                      <th className="text-left py-3 px-4">Registered At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.recentRegistrations.map((reg: any) => (
                      <tr key={reg.id} className="border-b border-white/5 hover:bg-white/5 transition">
                        <td className="py-3 px-4">{reg.userName}</td>
                        <td className="py-3 px-4 text-gray-400">{reg.userEmail}</td>
                        <td className="py-3 px-4">{reg.eventTitle}</td>
                        <td className="py-3 px-4 text-gray-400">
                          {new Date(reg.registeredAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400">Failed to load analytics data</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
