export interface BaseEventLike {
  id: string;
  title: string;
  description: string;
  date: string;
  venue: string;
  visibility?: 'PUBLIC' | 'COLLEGE' | 'PRIVATE';
  organiser?: {
    firstName?: string;
    lastName?: string;
  };
  _count?: {
    registrations?: number;
    bookmarks?: number;
  };
}

export type BrowseSortMode = 'date' | 'newest' | 'popularity';
export type BookmarkSortMode = 'recent' | 'date' | 'popularity';

export function formatEventDate(dateValue: string): string {
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

export function getOrganizerDisplayName(event: BaseEventLike): string {
  const first = event.organiser?.firstName || '';
  const last = event.organiser?.lastName || '';
  const full = `${first} ${last}`.trim();
  return full || 'Unknown organizer';
}

export function searchEvents<T extends BaseEventLike>(events: T[], query: string): T[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return events;
  }

  return events.filter((event) => {
    return (
      event.title.toLowerCase().includes(normalized) ||
      event.description.toLowerCase().includes(normalized) ||
      event.venue.toLowerCase().includes(normalized) ||
      getOrganizerDisplayName(event).toLowerCase().includes(normalized)
    );
  });
}

export function filterByVisibility<T extends BaseEventLike>(
  events: T[],
  visibility: 'all' | 'public' | 'college'
): T[] {
  if (visibility === 'all') {
    return events;
  }

  return events.filter((event) => {
    if (visibility === 'public') {
      return event.visibility === 'PUBLIC';
    }

    return event.visibility === 'COLLEGE' || event.visibility === 'PRIVATE';
  });
}

export function sortBrowseEvents<T extends BaseEventLike>(events: T[], mode: BrowseSortMode): T[] {
  const list = [...events];

  if (mode === 'date') {
    list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } else if (mode === 'newest') {
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } else {
    list.sort((a, b) => (b._count?.registrations || 0) - (a._count?.registrations || 0));
  }

  return list;
}

export function sortBookmarkEvents<T extends BaseEventLike>(events: T[], mode: BookmarkSortMode): T[] {
  if (mode === 'recent') {
    return events;
  }

  return sortBrowseEvents(events, mode === 'date' ? 'date' : 'popularity');
}
