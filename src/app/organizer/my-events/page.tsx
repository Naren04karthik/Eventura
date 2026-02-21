'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type SortOption = 'date' | 'popularity';

type MyEvent = {
  id: string;
  title: string;
  date: string;
  venue: string;
  registrations: number;
  isLive: boolean;
};


// built my event page with search , sort and event card list
const initialEvents: MyEvent[] = [
  {
    id: '1',
    title: 'Web Development Workshop',
    date: '2026-03-18T10:00:00.000Z',
    venue: 'Main Auditorium',
    registrations: 124,
    isLive: true,
  },
  {
    id: '2',
    title: 'AI Hackathon',
    date: '2026-03-25T09:30:00.000Z',
    venue: 'Innovation Lab',
    registrations: 212,
    isLive: false,
  },
  {
    id: '3',
    title: 'Startup Pitch Day',
    date: '2026-04-02T13:00:00.000Z',
    venue: 'Seminar Hall B',
    registrations: 86,
    isLive: false,
  },
];

export default function OrganizerMyEventsPage() {
  const [events] = useState<MyEvent[]>(initialEvents);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date');

  const filteredEvents = useMemo(() => {
    return [...events]
      .filter((event) => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) {
          return true;
        }

        return (
          event.title.toLowerCase().includes(query) ||
          event.venue.toLowerCase().includes(query)
        );
      })
      .sort((eventA, eventB) => {
        if (sortBy === 'date') {
          return new Date(eventA.date).getTime() - new Date(eventB.date).getTime();
        }

        return eventB.registrations - eventA.registrations;
      });
  }, [events, searchQuery, sortBy]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My Events</h1>
          <p className="mt-2 text-sm opacity-80">Manage and track all events created by you.</p>
        </div>

        <Link
          href="/events/create"
          className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium"
        >
          Create Event
        </Link>
      </header>

      <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search by title or venue"
          className="w-full rounded-lg border p-2.5 text-sm"
        />

        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as SortOption)}
          className="rounded-lg border p-2.5 text-sm"
        >
          <option value="date">Sort by Date</option>
          <option value="popularity">Sort by Popularity</option>
        </select>
      </section>

      {filteredEvents.length === 0 ? (
        <section className="rounded-xl border p-8 text-center">
          <p className="text-sm opacity-80">No events match your current search.</p>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredEvents.map((event) => (
            <article key={event.id} className="rounded-xl border p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-xs font-medium opacity-70">Event</span>
                <span className="rounded-full border px-2 py-1 text-xs">
                  {event.isLive ? 'Live' : 'Draft'}
                </span>
              </div>

              <h2 className="text-base font-semibold">{event.title}</h2>
              <p className="mt-2 text-sm opacity-80">{event.venue}</p>
              <p className="mt-1 text-sm opacity-80">
                {new Date(event.date).toLocaleString()}
              </p>

              <p className="mt-3 text-sm">
                Registrations: <span className="font-medium">{event.registrations}</span>
              </p>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
