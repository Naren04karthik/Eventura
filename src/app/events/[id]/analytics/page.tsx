'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

interface AnalyticsData {
  event: {
    title: string;
    capacity: number;
    date: string;
    venue: string;
    registrationType: string;
  };
  statistics: {
    totalRegistrations: number;
    capacity: number;
    availableSlots: number;
    attendanceRate: string;
    attendedCount: number;
  };
  statusBreakdown: {
    PENDING: number;
    CONFIRMED: number;
    ATTENDED: number;
    CANCELLED: number;
  };
  collegeDistribution: Array<{ name: string; count: number }>;
  registrationTimeline: Array<{ date: string; count: number }>;
  registrations: Array<{
    id: string;
    userName: string;
    userEmail: string;
    college: string;
    status: string;
    attendanceMarkedAt: string | null;
    createdAt: string;
  }>;
}

export default function EventAnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params?.id) {
      fetchAnalytics();
    }
  }, [params?.id]);

  const fetchAnalytics = async () => {
    try {
      const eventId = Array.isArray(params.id) ? params.id[0] : params.id;
      const response = await fetch(`/api/events/${eventId}/analytics`);
      const rawText = await response.text();
      let payload: any = null;
      try {
        payload = rawText ? JSON.parse(rawText) : null;
      } catch {
        payload = null;
      }
      
      if (response.ok) {
        setAnalytics(payload?.data || null);
      } else if (response.status === 403 || response.status === 401) {
        setError(
          payload?.message ||
            payload?.error ||
            `You do not have permission to view this analytics (HTTP ${response.status})`
        );
      } else {
        setError(
          payload?.message ||
            payload?.error ||
            `Failed to load analytics (HTTP ${response.status})`
        );
      }
    } catch (error) {
      console.error('Analytics fetch error:', error);
      setError('Error loading analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading analytics...</div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Failed to load analytics'}</p>
          <Link href="/browse" className="text-blue-400 hover:underline">
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  // Chart data configurations
  const capacityData = {
    labels: ['Registered', 'Available'],
    datasets: [
      {
        data: [analytics.statistics.totalRegistrations, analytics.statistics.availableSlots],
        backgroundColor: ['#22c55e', '#374151'],
        borderWidth: 0,
      },
    ],
  };

  const collegeData = {
    labels: analytics.collegeDistribution.slice(0, 10).map((c) => c.name),
    datasets: [
      {
        label: 'Registrations',
        data: analytics.collegeDistribution.slice(0, 10).map((c) => c.count),
        backgroundColor: '#3b82f6',
      },
    ],
  };

  const timelineData = {
    labels: analytics.registrationTimeline.map((t) => new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Daily Registrations',
        data: analytics.registrationTimeline.map((t) => t.count),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#ffffff',
        },
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        ticks: { color: '#ffffff' },
        grid: { color: '#374151' },
      },
      y: {
        ticks: { color: '#ffffff' },
        grid: { color: '#374151' },
      },
    },
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        ticks: { color: '#ffffff' },
        grid: { color: '#374151' },
      },
      y: {
        ticks: { color: '#ffffff', stepSize: 1 },
        grid: { color: '#374151' },
      },
    },
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-xl border-b border-white/10">
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="flex items-center justify-between px-7 py-4">
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
              href={`/events/${params.id}`}
              className="text-sm hover:text-white/80 transition"
            >
              Back to Event
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{analytics.event.title}</h1>
          <p className="text-gray-400">Event Analytics Dashboard</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <p className="text-sm text-gray-400 mb-2">Total Registrations</p>
            <p className="text-3xl font-bold">{analytics.statistics.totalRegistrations}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <p className="text-sm text-gray-400 mb-2">Capacity</p>
            <p className="text-3xl font-bold">{analytics.statistics.capacity >= 9999 ? '∞' : analytics.statistics.capacity}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <p className="text-sm text-gray-400 mb-2">Available Slots</p>
            <p className="text-3xl font-bold">{analytics.statistics.capacity >= 9999 ? '∞' : analytics.statistics.availableSlots}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <p className="text-sm text-gray-400 mb-2">Attendance Rate</p>
            <p className="text-3xl font-bold">{analytics.statistics.attendanceRate}%</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Capacity Chart */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Registration vs Capacity</h2>
            <div className="h-64">
              <Doughnut data={capacityData} options={doughnutOptions} />
            </div>
          </div>

          {/* College Distribution */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Top Colleges</h2>
            <div className="h-64">
              <Bar data={collegeData} options={barOptions} />
            </div>
          </div>

          {/* Registration Timeline */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Registration Timeline</h2>
            <div className="h-64">
              <Line data={timelineData} options={lineOptions} />
            </div>
          </div>
        </div>

        {/* Registration Table */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Registrations</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-sm text-gray-400">Name</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-400">Email</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-400">College</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-400">Registered</th>
                </tr>
              </thead>
              <tbody>
                {analytics.registrations.slice(0, 10).map((reg) => (
                  <tr key={reg.id} className="border-b border-white/5">
                    <td className="py-3 px-4">{reg.userName}</td>
                    <td className="py-3 px-4 text-sm text-gray-400">{reg.userEmail}</td>
                    <td className="py-3 px-4 text-sm text-gray-400">{reg.college}</td>
                    <td className="py-3 px-4 text-sm text-gray-400">
                      {new Date(reg.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
