'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import EventPreviewCard from '@/components/layout/EventPreviewCard';
import { useAuth } from '@/contexts/auth-context';
import type { BrowseEvent } from '@/types';

export default function BrowseEventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<BrowseEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<BrowseEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'popularity'>('date');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'college'>('all');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events?page=1&limit=100');
      if (response.ok) {
        const data = await response.json();
        const eventsList = data.data?.events || data.events || [];
        setEvents(eventsList);
        setFilteredEvents(eventsList);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let results = events.filter((event) => {
      // Text search filter
      const matchesSearch =
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.venue.toLowerCase().includes(searchQuery.toLowerCase());

      // Visibility filter
      let matchesVisibility = true;
      if (visibilityFilter !== 'all') {
        try {
          const customFields = event.customRegistrationFields 
            ? JSON.parse(event.customRegistrationFields) 
            : null;
          const visibility = customFields?.visibility?.mode || 'Public';
          
          if (visibilityFilter === 'public') {
            matchesVisibility = visibility === 'Public';
          } else if (visibilityFilter === 'college') {
            matchesVisibility = visibility === 'College' || visibility === 'Custom';
          }
        } catch {
          // If metadata is malformed, keep event visible instead of failing the filter.
          matchesVisibility = true;
        }
      }

      return matchesSearch && matchesVisibility;
    });

    if (sortBy === 'date') {
      results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else {
      results.sort((a, b) => b._count.registrations - a._count.registrations);
    }

    setFilteredEvents(results);
  }, [searchQuery, sortBy, visibilityFilter, events]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="text-white">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink text-white flex flex-col">
      {/* Header */}
      {user ? (
        <Navbar user={user} />
      ) : (
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
                <Link
                  href="/login"
                  className="rounded-full border-thin px-4 py-2 text-sm text-muted transition hover:text-white hover:shadow-[0_0_0_1px_rgba(255,255,255,0.9)]"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg border-strong bg-white/10 px-4 py-2 text-sm text-white transition hover:shadow-[0_0_0_1px_rgba(255,255,255,0.9)]"
                >
                  Register
                </Link>
              </div>
            </div>
          </div>
        </header>
      )}

      <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-8">
        {/* Filter Tabs and Search Row */}
        <div className="mb-8">
          {/* Visibility Filter Tabs */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setVisibilityFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                visibilityFilter === 'all'
                  ? 'border border-neon text-neon'
                  : 'bg-white/5 text-muted hover:bg-white/10 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setVisibilityFilter('public')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                visibilityFilter === 'public'
                  ? 'border border-neon text-neon'
                  : 'bg-white/5 text-muted hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Public
              </span>
            </button>
            <button
              onClick={() => setVisibilityFilter('college')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                visibilityFilter === 'college'
                  ? 'border border-neon text-neon'
                  : 'bg-white/5 text-muted hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                </svg>
                College
              </span>
            </button>
          </div>

          {/* Search and Sort Row */}
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by title, description, or location..."
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
        </div>

        {/* Events Grid */}
        {filteredEvents.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredEvents.map((event) => {
              const organizerName = `${event.organiser.firstName} ${event.organiser.lastName}`.trim();

              return (
                <EventPreviewCard
                  key={event.id}
                  href={`/events/${event.eventCode}`}
                  title={event.title}
                  date={event.date}
                  venue={event.venue}
                  bannerUrl={event.bannerUrl}
                  registrationCount={event._count.registrations}
                  organizerName={organizerName}
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
                className="px-4 py-2 bg-neon text-black rounded-lg hover:bg-neon/80 transition text-sm font-medium">
                Clear Search
              </button>
            )}
          </div>
        )}
      </main>
      
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}
