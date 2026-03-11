'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import EventPreviewCard from '@/components/layout/EventPreviewCard';
import { useAuth } from '@/contexts/auth-context';
import type { OrganizedEvent } from '@/types';

export default function OrganizerMyEventsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [events, setEvents] = useState<OrganizedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'popularity'>('date');

  useEffect(() => {
    const load = async () => {
      try {
        if (!user || user.role !== 'ORGANIZER') {
          router.push('/dashboard');
          return;
        }

        const mineResponse = await fetch('/api/events/mine');
        if (mineResponse.ok) {
          const mineData = await mineResponse.json();
          const rawEvents = mineData.data?.events || [];
          setEvents(Array.isArray(rawEvents) ? rawEvents : []);
        }
      } catch (error) {
        console.error('Failed to load my events:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, router]);

  const filteredEvents = useMemo(() => {
    return [...events]
      .filter((event) => {
        const q = searchQuery.trim().toLowerCase();
        const venueLabel = event.venue.toLowerCase();
        const matchesSearch =
          q.length === 0 ||
          event.title.toLowerCase().includes(q) ||
          venueLabel.includes(q);

        if (!matchesSearch) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date') {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        return (b._count?.registrations || 0) - (a._count?.registrations || 0);
      });
  }, [events, searchQuery, sortBy]);

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
      <Navbar user={user} />

      <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-12">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-normal mb-2">My Events</h1>
            <p className="text-muted">All events created by you</p>
          </div>
          <Link
            href="/events/create"
            className="rounded-lg bg-neon px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-neon/90"
          >
            Create Event
          </Link>
        </div>

        <div className="mb-6 flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search your events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:border-white/30 transition"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'popularity')}
            className="px-4 py-2.5 bg-black/40 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-white/30 transition cursor-pointer"
          >
            <option value="date">Sort by Date</option>
            <option value="popularity">Sort by Popularity</option>
          </select>
        </div>

        {filteredEvents.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredEvents.map((event) => {
              return (
                <EventPreviewCard
                  key={event.id}
                  href={`/events/${event.eventCode || event.id}`}
                  title={event.title}
                  date={event.date}
                  venue={event.venue}
                  bannerUrl={event.bannerUrl}
                  registrationCount={event._count?.registrations || 0}
                  footerLabel="Your event"
                  customRegistrationFields={event.customRegistrationFields}
                  isLive={Boolean(event.isLive)}
                />
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-white/10 bg-black/30 p-12 text-center">
            <p className="text-muted mb-4">
              {searchQuery ? 'No events found matching your search' : 'No events available'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-neon text-black rounded-lg hover:bg-neon/80 transition text-sm font-medium"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
