'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface BookmarkedEvent {
  id: string;
  eventCode?: string;
  title: string;
  description: string;
  date: string;
  venue: string;
  bannerUrl?: string | null;
  capacity?: number;
  visibility?: 'PUBLIC' | 'COLLEGE' | 'PRIVATE';
  organiser?: {
    id?: string;
    firstName?: string;
    lastName?: string;
  };
  _count?: {
    registrations?: number;
    bookmarks?: number;
  };
}

interface BookmarkResponse {
  success: boolean;
  data?: {
    bookmarks?: BookmarkedEvent[];
    pagination?: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
      pages: number;
    };
  };
  error?: string;
}

export default function BookmarksPage() {
  const [events, setEvents] = useState<BookmarkedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'date' | 'popularity'>('recent');
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  async function fetchBookmarks() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/bookmarks?limit=100');
      const data: BookmarkResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch bookmarks');
      }

      const bookmarks = data.data?.bookmarks || [];
      setEvents(bookmarks);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load bookmarks';
      setError(message);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleBookmark(eventId: string) {
    try {
      setRemovingId(eventId);

      const response = await fetch('/api/bookmarks/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to remove bookmark');
      }

      setEvents((prev) => prev.filter((event) => event.id !== eventId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update bookmark';
      setError(message);
    } finally {
      setRemovingId(null);
    }
  }

  function formatDate(dateValue: string) {
    const dt = new Date(dateValue);
    if (Number.isNaN(dt.getTime())) {
      return dateValue;
    }
    return dt.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function organizerName(event: BookmarkedEvent) {
    const first = event.organiser?.firstName || '';
    const last = event.organiser?.lastName || '';
    const full = `${first} ${last}`.trim();
    return full || 'Unknown organizer';
  }

  const filteredEvents = useMemo(() => {
    let list = [...events];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter((event) => {
        return (
          event.title.toLowerCase().includes(query) ||
          event.description.toLowerCase().includes(query) ||
          event.venue.toLowerCase().includes(query) ||
          organizerName(event).toLowerCase().includes(query)
        );
      });
    }

    if (sortBy === 'date') {
      list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else if (sortBy === 'popularity') {
      list.sort((a, b) => (b._count?.registrations || 0) - (a._count?.registrations || 0));
    }

    return list;
  }, [events, searchQuery, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 mx-auto rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <p className="mt-3 text-sm text-gray-600">Loading your bookmarks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Bookmarks</h1>
            <p className="mt-1 text-sm text-gray-600">
              {filteredEvents.length} saved event{filteredEvents.length === 1 ? '' : 's'}
            </p>
          </div>

          <div className="flex w-full gap-3 sm:w-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bookmarks"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'date' | 'popularity')}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
            >
              <option value="recent">Recently Added</option>
              <option value="date">Event Date</option>
              <option value="popularity">Popularity</option>
            </select>
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
            <button
              onClick={fetchBookmarks}
              className="ml-3 font-semibold underline underline-offset-2"
            >
              Retry
            </button>
          </div>
        ) : null}

        {filteredEvents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
            <p className="text-xl font-semibold text-gray-900">No bookmarks yet</p>
            <p className="mt-2 text-sm text-gray-600">
              Save events from the browse page and they will appear here.
            </p>
            <Link
              href="/browse"
              className="mt-5 inline-flex rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Go to Browse Events
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredEvents.map((event) => (
              <article
                key={event.id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
              >
                <Link href={`/events/${event.eventCode || event.id}`}>
                  {event.bannerUrl ? (
                    <div className="relative h-44 w-full bg-gray-100">
                      <Image
                        src={event.bannerUrl}
                        alt={event.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-44 w-full items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-4xl text-white">
                      🎫
                    </div>
                  )}
                </Link>

                <div className="p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                      {event.visibility === 'PUBLIC' ? 'Public' : 'College'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {event._count?.bookmarks || 0} bookmarks
                    </span>
                  </div>

                  <Link href={`/events/${event.eventCode || event.id}`}>
                    <h2 className="line-clamp-2 text-lg font-semibold text-gray-900 hover:text-blue-700">
                      {event.title}
                    </h2>
                  </Link>

                  <p className="mt-2 line-clamp-2 text-sm text-gray-600">{event.description}</p>

                  <div className="mt-4 space-y-1.5 text-sm text-gray-600">
                    <p>📅 {formatDate(event.date)}</p>
                    <p className="truncate">📍 {event.venue}</p>
                    <p className="truncate">👤 {organizerName(event)}</p>
                    <p>
                      👥 {event._count?.registrations || 0}
                      {event.capacity ? ` / ${event.capacity}` : ''} registered
                    </p>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <Link
                      href={`/events/${event.eventCode || event.id}`}
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      View Event
                    </Link>
                    <button
                      onClick={() => handleToggleBookmark(event.id)}
                      disabled={removingId === event.id}
                      className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {removingId === event.id ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
