'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/auth-context';
import type { CollegeOption } from '@/types';
import type { OrganizerRequest, AdminDashboardUser } from '@/types';
import type { AdminEventSummary } from '@/types';

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminDashboardUser[]>([]);
  const [events, setEvents] = useState<AdminEventSummary[]>([]);
  const [organizerRequests, setOrganizerRequests] = useState<OrganizerRequest[]>([]);
  const [colleges, setColleges] = useState<CollegeOption[]>([]);
  const [showCollegeModal, setShowCollegeModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>('');
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'events' | 'organizers'>('users');

  useEffect(() => {
    fetchAdminData();
  }, []);

  useEffect(() => {
    if (activeTab === 'organizers') {
      fetchColleges();
    }
  }, [activeTab]);

  const fetchAdminData = async () => {
    try {
      if (!user || user.role !== 'ADMIN') {
        router.push('/user/dashboard');
        return;
      }

      // Fetch users for this admin's college
      const usersResponse = await fetch('/api/admin/users');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.data || usersData.users || []);
      }

      // Fetch all events
      const eventsResponse = await fetch('/api/admin/events');
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setEvents(eventsData.events || []);
      }

      await fetchOrganizerRequests();
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizerRequests = async () => {
    try {
      const response = await fetch('/api/admin/organisers');
      if (response.ok) {
        const data = await response.json();
        setOrganizerRequests(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch organizer requests:', error);
    }
  };

  const fetchColleges = async () => {
    try {
      const response = await fetch('/api/colleges');
      if (response.ok) {
        const data = await response.json();
        setColleges(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch colleges:', error);
    }
  };

  const openCollegeModal = (requestId: string) => {
    setSelectedRequestId(requestId);
    setSelectedCollegeId('');
    setShowCollegeModal(true);
  };

  const closeCollegeModal = () => {
    setShowCollegeModal(false);
    setSelectedRequestId(null);
    setSelectedCollegeId('');
  };

  const handleOrganizerAction = async (requestId: string, action: 'APPROVE' | 'REJECT', collegeId?: string) => {
    setRequestsLoading(true);
    try {
      const response = await fetch('/api/admin/organisers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action, collegeId }),
      });
      if (response.ok) {
        await fetchOrganizerRequests();
        closeCollegeModal();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to process request');
      }
    } catch (error) {
      console.error('Failed to process organizer request:', error);
      alert('Failed to process request');
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleApproveWithCollege = () => {
    if (!selectedCollegeId) {
      alert('Please select a college');
      return;
    }
    if (selectedRequestId) {
      handleOrganizerAction(selectedRequestId, 'APPROVE', selectedCollegeId);
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-ink text-white flex flex-col">
      {/* Header */}
      <Navbar user={user} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
        {/* Navigation Tabs */}
        <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('users')}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === 'users'
                  ? 'bg-white/10 text-white'
                  : 'text-muted hover:bg-white/5 hover:text-white'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === 'events'
                  ? 'bg-white/10 text-white'
                  : 'text-muted hover:bg-white/5 hover:text-white'
              }`}
            >
              Events
            </button>
            <button
              onClick={() => setActiveTab('organizers')}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === 'organizers'
                  ? 'bg-white/10 text-white'
                  : 'text-muted hover:bg-white/5 hover:text-white'
              }`}
            >
              Organizer Requests
            </button>
          </div>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="rounded-3xl border-strong bg-black p-8">
            <h2 className="mb-6 text-xl font-normal">Users</h2>
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-4 text-left text-sm font-medium text-soft uppercase tracking-[0.1em]">Name</th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-soft uppercase tracking-[0.1em]">Email</th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-soft uppercase tracking-[0.1em]">Role</th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-soft uppercase tracking-[0.1em]">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-sm text-muted" colSpan={4}>
                      No users found for your college.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b border-white/5 transition hover:bg-white/5">
                      <td className="px-4 py-4 text-sm font-medium">{u.firstName} {u.lastName}</td>
                      <td className="px-4 py-4 text-sm text-muted">{u.email}</td>
                      <td className="px-4 py-4 text-sm">
                        <span className="inline-block px-2 py-1 text-xs rounded-full bg-neon/10 text-neon">
                          {u.role === 'USER' ? 'STUDENT' : u.role}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-soft">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="rounded-3xl border-strong bg-black p-8">
            <h2 className="mb-6 text-xl font-normal">Events</h2>
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-4 text-left text-sm font-medium text-soft uppercase tracking-[0.1em]">Event Title</th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-soft uppercase tracking-[0.1em]">Registrations</th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-soft uppercase tracking-[0.1em]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="border-b border-white/5 transition hover:bg-white/5">
                    <td className="px-4 py-4 text-sm">{e.title}</td>
                    <td className="px-4 py-4 text-sm">{e._count.registrations}</td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/events/${e.eventCode}`}
                        className="text-neon hover:underline text-sm"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        )}

        {activeTab === 'organizers' && (
          <div className="rounded-3xl border-strong bg-black p-8">
            <h2 className="mb-6 text-xl font-normal">Organizer Requests</h2>
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-4 text-left text-sm font-medium text-soft uppercase tracking-[0.1em]">Organizer</th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-soft uppercase tracking-[0.1em]">College</th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-soft uppercase tracking-[0.1em]">Contact</th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-soft uppercase tracking-[0.1em]">Reason</th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-soft uppercase tracking-[0.1em]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {organizerRequests.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-sm text-muted" colSpan={5}>
                      No pending organizer requests.
                    </td>
                  </tr>
                ) : (
                  organizerRequests.map((request) => (
                    <tr key={request.id} className="border-b border-white/5 transition hover:bg-white/5">
                      <td className="px-4 py-4">
                        <div className="font-medium">{request.user.firstName} {request.user.lastName}</div>
                        <div className="text-xs text-muted">{request.user.email}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium">{request.organizationName}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted">
                        {request.contactNumber}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted">
                        {request.reason}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openCollegeModal(request.id)}
                            disabled={requestsLoading}
                            className="rounded-full border border-green-500/40 px-3 py-1 text-xs text-green-400 transition hover:bg-green-500/10 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleOrganizerAction(request.id, 'REJECT')}
                            disabled={requestsLoading}
                            className="rounded-full border border-red-500/40 px-3 py-1 text-xs text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          </div>
        )}
      </main>

      {/* College Selection Modal */}
      {showCollegeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-lg border border-white/10 bg-ink p-6 shadow-2xl">
            <h2 className="mb-4 text-xl font-semibold">Select College</h2>
            <p className="mb-4 text-sm text-muted">
              Choose which college this organizer belongs to
            </p>
            
            <div className="mb-6">
              <label htmlFor="college-select" className="mb-2 block text-sm font-medium">
                College
              </label>
              <select
                id="college-select"
                value={selectedCollegeId}
                onChange={(e) => setSelectedCollegeId(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-neon focus:outline-none focus:ring-1 focus:ring-neon"
              >
                <option value="">Select a college...</option>
                {colleges.map((college) => (
                  <option key={college.id} value={college.id}>
                    {college.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={closeCollegeModal}
                disabled={requestsLoading}
                className="rounded-md border border-white/10 px-4 py-2 text-sm transition hover:bg-white/5 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveWithCollege}
                disabled={requestsLoading || !selectedCollegeId}
                className="rounded-md bg-neon px-4 py-2 text-sm font-medium text-black transition hover:bg-neon/90 disabled:opacity-50"
              >
                {requestsLoading ? 'Approving...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
