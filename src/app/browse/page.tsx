'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Event {
  id: string;
  eventCode?: string;
  title: string;
  description: string;
  date: string;
  venue: string;
  bannerUrl?: string;
  capacity: number;
  visibility?: 'PUBLIC' | 'COLLEGE' | 'PRIVATE';
  organiser: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
  college?: {
    id: string;
    name: string;
  };
  _count?: {
    registrations: number;
    bookmarks: number;
  };
  isLive?: boolean;
}

export default function BrowseEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'popularity' | 'newest'>('date');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'college'>('all');
  const [page, setPage] = useState(1);

  // Fetch all events on component mount
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/events?page=1&limit=100');
      
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      
      const data = await response.json();
      const eventsList = data.data?.events || data.events || [];
      setEvents(eventsList);
      setFilteredEvents(eventsList);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort events based on user selections
  useEffect(() => {
    let results = events.filter((event) => {
      // Text search filter - searches title, description, and venue
      const matchesSearch =
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.venue.toLowerCase().includes(searchQuery.toLowerCase());

      // Visibility filter
      let matchesVisibility = true;
      if (visibilityFilter === 'public') {
        matchesVisibility = event.visibility === 'PUBLIC';
      } else if (visibilityFilter === 'college') {
        matchesVisibility = event.visibility === 'COLLEGE' || event.visibility === 'PRIVATE';
      }

      return matchesSearch && matchesVisibility;
    });

    // Apply sorting
    if (sortBy === 'date') {
      results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else if (sortBy === 'popularity') {
      results.sort((a, b) => (b._count?.registrations || 0) - (a._count?.registrations || 0));
    } else if (sortBy === 'newest') {
      results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    setFilteredEvents(results);
    setPage(1);
  }, [searchQuery, sortBy, visibilityFilter, events]);

  // Format organizer name
  const getOrganizerName = (organiser: Event['organiser']) => {
    const firstName = organiser?.firstName || '';
    const lastName = organiser?.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown Organizer';
  };

  // Format date display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Section */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Browse Events</h1>
              <p className="text-gray-600 text-sm mt-1">
                {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
              </p>
            </div>
            <button
              onClick={fetchEvents}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Refresh
            </button>
          </div>

          {/* Visibility Filter Tabs */}
          <div className="flex gap-2 flex-wrap mb-4">
            <button
              onClick={() => setVisibilityFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                visibilityFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => setVisibilityFilter('public')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                visibilityFilter === 'public'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🌍 Public
            </button>
            <button
              onClick={() => setVisibilityFilter('college')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                visibilityFilter === 'college'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🎓 College
            </button>
          </div>

          {/* Search and Sort Row */}
          <div className="flex gap-3 flex-col sm:flex-row">
            <input
              type="text"
              placeholder="Search by title, description, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'popularity' | 'newest')}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition cursor-pointer bg-white"
            >
              <option value="date">Earliest First</option>
              <option value="newest">Newest First</option>
              <option value="popularity">Most Popular</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
            <button
              onClick={fetchEvents}
              className="ml-4 underline hover:no-underline font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Events Grid */}
        {filteredEvents.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <Link key={event.id} href={`/events/${event.eventCode || event.id}`}>
                <div className="h-full bg-white rounded-lg shadow hover:shadow-xl transition-shadow duration-300 overflow-hidden cursor-pointer hover:scale-105 transform">
                  {/* Banner Image */}
                  {event.bannerUrl ? (
                    <div className="relative h-40 overflow-hidden bg-gray-200">
                      <Image
                        src={event.bannerUrl}
                        alt={event.title}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-40 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                      <span className="text-4xl">🎉</span>
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4">
                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600">
                      {event.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {event.description}
                    </p>

                    {/* Meta Info */}
                    <div className="space-y-2 text-sm text-gray-600">
                      {/* Date */}
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📅</span>
                        <span>{formatDate(event.date)}</span>
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📍</span>
                        <span className="truncate">{event.venue}</span>
                      </div>

                      {/* Organizer */}
                      <div className="flex items-center gap-2">
                        <span className="text-lg">👤</span>
                        <span className="truncate">{getOrganizerName(event.organiser)}</span>
                      </div>

                      {/* Registration Count */}
                      <div className="flex items-center gap-2">
                        <span className="text-lg">👥</span>
                        <span>
                          {event._count?.registrations || 0} registered
                          {event.capacity && ` / ${event.capacity}`}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="mt-4 flex items-center gap-2">
                      {event.isLive && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <span className="animate-pulse">●</span>
                          Live
                        </span>
                      )}
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {event.visibility === 'PUBLIC' ? '🌍 Public' : '🎓 College'}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No events found</h2>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? `No events match "${searchQuery}". Try adjusting your search or filters.`
                : 'No events are currently available.'}
            </p>
            {(searchQuery || visibilityFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setVisibilityFilter('all');
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
