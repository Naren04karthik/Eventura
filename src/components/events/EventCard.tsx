'use client';

import Link from 'next/link';
import Image from 'next/image';

export interface EventCardData {
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
    firstName?: string;
    lastName?: string;
  };
  _count?: {
    registrations?: number;
    bookmarks?: number;
  };
  isLive?: boolean;
}

interface EventCardProps {
  event: EventCardData;
  variant?: 'browse' | 'bookmarks';
  onToggleBookmark?: (eventId: string) => void;
  toggling?: boolean;
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

function getOrganizerName(event: EventCardData) {
  const first = event.organiser?.firstName || '';
  const last = event.organiser?.lastName || '';
  const full = `${first} ${last}`.trim();
  return full || 'Unknown organizer';
}

export default function EventCard({
  event,
  variant = 'browse',
  onToggleBookmark,
  toggling = false,
}: EventCardProps) {
  const eventPath = `/events/${event.eventCode || event.id}`;

  return (
    <article className="h-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-shadow duration-300">
      <Link href={eventPath}>
        {event.bannerUrl ? (
          <div className="relative h-44 w-full bg-gray-100">
            <Image src={event.bannerUrl} alt={event.title} fill className="object-cover" />
          </div>
        ) : (
          <div className="flex h-44 w-full items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-4xl text-white">
            {variant === 'bookmarks' ? '🎫' : '🎉'}
          </div>
        )}
      </Link>

      <div className="p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
            {event.visibility === 'PUBLIC' ? 'Public' : 'College'}
          </span>
          <span className="text-xs text-gray-500">{event._count?.bookmarks || 0} bookmarks</span>
        </div>

        <Link href={eventPath}>
          <h2 className="line-clamp-2 text-lg font-semibold text-gray-900 hover:text-blue-700">
            {event.title}
          </h2>
        </Link>

        <p className="mt-2 line-clamp-2 text-sm text-gray-600">{event.description}</p>

        <div className="mt-4 space-y-1.5 text-sm text-gray-600">
          <p>📅 {formatDate(event.date)}</p>
          <p className="truncate">📍 {event.venue}</p>
          <p className="truncate">👤 {getOrganizerName(event)}</p>
          <p>
            👥 {event._count?.registrations || 0}
            {event.capacity ? ` / ${event.capacity}` : ''} registered
          </p>
        </div>

        <div className="mt-4 flex items-center gap-2">
          {event.isLive ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
              <span className="animate-pulse">●</span>
              Live
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Link
            href={eventPath}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            View Event
          </Link>

          {variant === 'bookmarks' && onToggleBookmark ? (
            <button
              onClick={() => onToggleBookmark(event.id)}
              disabled={toggling}
              className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {toggling ? 'Removing...' : 'Remove'}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
