'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import EventPreviewCard from '@/components/layout/EventPreviewCard';
import { useAuth } from '@/contexts/auth-context';
import type { BookmarkItem, EventCardItem, RegisteredItem } from '@/types';

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [registeredEvents, setRegisteredEvents] = useState<RegisteredItem[]>([]);
  const [savedEvents, setSavedEvents] = useState<BookmarkItem[]>([]);
  const [activeTab, setActiveTab] = useState<'registered' | 'saved'>('registered');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'popularity'>('date');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [registrationsResponse, bookmarksResponse] = await Promise.all([
          fetch('/api/registrations'),
          fetch('/api/bookmarks'),
        ]);

        if (registrationsResponse.ok) {
          const registrationsData = await registrationsResponse.json();
          const rawRegistrations = registrationsData.data?.registrations || registrationsData.registrations || [];
          setRegisteredEvents(Array.isArray(rawRegistrations) ? rawRegistrations : []);
        }

        if (bookmarksResponse.ok) {
          const bookmarksData = await bookmarksResponse.json();
          const rawBookmarks =
            bookmarksData.data?.bookmarks?.data ||
            bookmarksData.data?.bookmarks ||
            bookmarksData.bookmarks ||
            [];
          setSavedEvents(Array.isArray(rawBookmarks) ? rawBookmarks : []);
        }
      } catch (error) {
        console.error('Failed to load dashboard:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

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

  const getBaseEvents = (): EventCardItem[] => {
    if (activeTab === 'registered') {
      return registeredEvents.map((item) => ({
        id: item.event.id,
        eventCode: item.event.eventCode,
        title: item.event.title,
        date: item.event.date,
        venue: item.event.venue,
        bannerUrl: item.event.bannerUrl,
        registrationsCount: 0,
      }));
    }

    return savedEvents.map((item) => ({
      id: item.event.id,
      eventCode: item.event.eventCode,
      title: item.event.title,
      description: item.event.description,
      date: item.event.date,
      venue: item.event.venue,
      bannerUrl: item.event.bannerUrl,
      registrationsCount: item.event._count?.registrations || 0,
    }));
  };

  const filteredEvents = getBaseEvents()
    .filter((event) => {
      const query = searchQuery.trim().toLowerCase();
      return (
        query.length === 0 ||
        event.title.toLowerCase().includes(query) ||
        event.venue.toLowerCase().includes(query) ||
        (event.description || '').toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      return b.registrationsCount - a.registrationsCount;
    });

  const emptyStateTitle = activeTab === 'registered' ? 'No registered events yet.' : 'No saved events yet.';
  const emptyStateCta = activeTab === 'registered' ? 'Register from Explore Events' : 'Save events from Explore Events';

  return (
    <div className="min-h-screen bg-ink text-white flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-12">
        <section className="rounded-2xl border border-white/10 bg-black/50 p-6">
          <div className="mb-5 flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab('registered')}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'registered'
                  ? 'bg-neon text-black'
                  : 'bg-white/5 text-muted hover:bg-white/10 hover:text-white'
              }`}
            >
              My Registered Events ({registeredEvents.length})
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'saved'
                  ? 'bg-neon text-black'
                  : 'bg-white/5 text-muted hover:bg-white/10 hover:text-white'
              }`}
            >
              My Saved Events ({savedEvents.length})
            </button>
          </div>

          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              placeholder={`Search ${activeTab === 'registered' ? 'registered' : 'saved'} events...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white placeholder-white/40 transition focus:border-white/30 focus:outline-none"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'popularity')}
              className="rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white transition focus:border-white/30 focus:outline-none"
            >
              <option value="date">Sort by Date</option>
              <option value="popularity">Sort by Popularity</option>
            </select>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-black/30 p-10 text-center">
              <p className="mb-4 text-sm text-muted">{emptyStateTitle}</p>
              <Link
                href="/browse"
                className="inline-block rounded-lg bg-neon px-5 py-2 text-sm font-medium text-black transition hover:bg-neon/90"
              >
                {emptyStateCta}
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredEvents.map((event) => (
                <EventPreviewCard
                  key={event.id}
                  href={`/events/${event.eventCode || event.id}`}
                  title={event.title}
                  date={event.date}
                  venue={event.venue}
                  bannerUrl={event.bannerUrl}
                  registrationCount={event.registrationsCount}
                  footerLabel={activeTab === 'registered' ? 'Registered event' : 'Saved event'}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
