'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/contexts/auth-context';

interface Event {
  id: string;
  eventCode?: string;
  title: string;
  description: string;
  date: string;
  venue: string;
  capacity: number;
  organiser: {
    name: string;
  };
  _count: {
    registrations: number;
  };
}

export default function BookmarkedEventsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      // Fetch bookmarks
      const response = await fetch('/api/bookmarks');
      if (response.ok) {
        const data = await response.json();
        const rawBookmarks = data.data?.bookmarks?.data || data.data?.bookmarks || data.bookmarks || [];
        const mappedEvents = Array.isArray(rawBookmarks)
          ? rawBookmarks.map((item: any) => item.event).filter(Boolean)
          : [];
        setEvents(mappedEvents);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink text-white">
      {/* Header */}
      <Navbar user={user} />

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-normal mb-2">Bookmarked Events</h1>
          <p className="text-muted">Events you've saved for later</p>
        </div>

        {events.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.eventCode}`}
                className="group rounded-lg border border-white/10 bg-black/40 p-6 hover:border-neon/50 transition"
              >
                <h3 className="font-semibold group-hover:text-neon transition mb-2">
                  {event.title}
                </h3>
                <p className="text-sm text-muted line-clamp-2 mb-4">{event.description}</p>
                <div className="space-y-2 text-xs text-muted">
                  <p className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {event.venue}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(event.date).toLocaleDateString()}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {event._count.registrations} registered
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-white/10 bg-black/40 p-12 text-center">
            <p className="text-muted mb-4">You haven't bookmarked any events yet</p>
            <Link
              href="/dashboard"
              className="inline-block px-6 py-2 bg-neon text-black rounded-lg hover:bg-neon/80 transition"
            >
              Browse Events
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
