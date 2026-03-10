'use client';

import Link from 'next/link';

interface EventPreviewCardProps {
  href: string;
  title: string;
  date: string;
  venue: string;
  bannerUrl?: string | null;
  registrationCount?: number;
  organizerName?: string;
  footerLabel?: string;
  customRegistrationFields?: string;
  isLive?: boolean;
}

const extractIframeSrc = (input: string): string => {
  const standard = input.match(/<iframe[^>]*src=["']([^"']+)["'][^>]*>/i);
  if (standard?.[1]) {
    return standard[1].trim();
  }
  const escaped = input.match(/<iframe[^>]*src=\\"([^\\"]+)\\"[^>]*>/i);
  return escaped?.[1]?.trim() || '';
};

const stripHtml = (input: string): string => {
  return input
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const getVenueLabel = (venue: string): string => {
  if (!venue) return 'Location details unavailable';
  const venueText = stripHtml(venue);
  if (venueText) return venueText;
  if (extractIframeSrc(venue) || /https?:\/\//i.test(venue)) return 'View map';
  return 'Location details unavailable';
};

const getVisibilityMeta = (customRegistrationFields?: string) => {
  let visibilityText = 'Public';
  let visibilityBgColor = 'bg-green-500/80';

  try {
    const customFields = customRegistrationFields ? JSON.parse(customRegistrationFields) : null;
    const visibility = customFields?.visibility?.mode || 'Public';
    const collegeCount = customFields?.visibility?.collegeNames?.length || 0;

    if (visibility === 'College') {
      visibilityText = 'College Only';
      visibilityBgColor = 'bg-blue-500/80';
    } else if (visibility === 'Custom') {
      visibilityText = `${collegeCount} College${collegeCount !== 1 ? 's' : ''}`;
      visibilityBgColor = 'bg-purple-500/80';
    }
  } catch {
    // Keep defaults when visibility metadata is missing or malformed.
  }

  return { visibilityText, visibilityBgColor };
};

export default function EventPreviewCard({
  href,
  title,
  date,
  venue,
  bannerUrl,
  registrationCount = 0,
  organizerName,
  footerLabel,
  customRegistrationFields,
  isLive = false,
}: EventPreviewCardProps) {
  const eventDate = new Date(date);
  const formattedDate = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const formattedTime = eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const { visibilityText, visibilityBgColor } = getVisibilityMeta(customRegistrationFields);

  return (
    <Link href={href}>
      <div className="group relative flex h-[160px] cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-black/30 transition hover:border-neon/40">
        <div className="relative w-1/2 overflow-hidden bg-gradient-to-br from-pink-500/20 to-purple-500/20">
          {bannerUrl ? (
            <img
              src={bannerUrl}
              alt={title}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <svg className="h-12 w-12 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {customRegistrationFields && (
            <div className="absolute top-2 right-2">
              <span className={`rounded-md px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm ${visibilityBgColor}`}>
                {visibilityText}
              </span>
            </div>
          )}

          {isLive && (
            <div className="absolute bottom-2 left-2">
              <span className="flex items-center gap-1.5 rounded-md bg-red-500/90 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-white animate-pulse"></span>
                LIVE
              </span>
            </div>
          )}
        </div>

        <div className="flex w-1/2 flex-col justify-between p-4">
          <div>
            <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-white transition group-hover:text-neon">
              {title}
            </h3>

            <div className="mb-1.5 flex items-center gap-1.5 text-xs text-muted">
              <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formattedDate} • {formattedTime}</span>
            </div>

            <div className="mb-2 flex items-center gap-1.5 text-xs text-muted">
              <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="line-clamp-1">{getVenueLabel(venue)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-2 text-xs">
            <span className="truncate text-muted">{footerLabel || (organizerName ? `By ${organizerName}` : '')}</span>
            <span className="flex-shrink-0 rounded bg-white/10 px-2 py-1 font-medium text-white/80">
              <svg className="mr-1 inline-block h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {registrationCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}