'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import type { CollegeOption } from '@/types';
import type { EventDetails, FormValue, RegistrationField } from '@/types';
import FieldInput from './_FieldInput';

export default function EventDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isOrganizerOfEvent, setIsOrganizerOfEvent] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const [eventCode, setEventCode] = useState<string | null>(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showGoogleFormPopup, setShowGoogleFormPopup] = useState(false);
  const [registrationSource, setRegistrationSource] = useState<'WEBSITE' | 'GOOGLE_FORM'>('WEBSITE');
  const [externalFormUrl, setExternalFormUrl] = useState<string>('');
  const [isLive, setIsLive] = useState(false);
  const [registrationType, setRegistrationType] = useState<'SOLO' | 'TEAM'>('SOLO');
  const [teamRequired, setTeamRequired] = useState(false);
  const [minTeamSize, setMinTeamSize] = useState(1);
  const [maxTeamSize, setMaxTeamSize] = useState(1);
  const [teamSizeMode, setTeamSizeMode] = useState<'FIXED' | 'VARIABLE'>('VARIABLE');
  const [registrationFields, setRegistrationFields] = useState<RegistrationField[]>([]);
  const [leaderFormData, setLeaderFormData] = useState<Record<string, FormValue>>({});
  const [teamMembers, setTeamMembers] = useState<Array<Record<string, FormValue>>>([]);
  const [showPosterPreview, setShowPosterPreview] = useState(false);
  const [showQrPopup, setShowQrPopup] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [paymentScreenshotPreview, setPaymentScreenshotPreview] = useState<string | null>(null);
  const [colleges, setColleges] = useState<CollegeOption[]>([]);

  const buildDefaultFormData = (fields: RegistrationField[]) => {
    return fields.reduce<Record<string, FormValue>>((acc, field) => {
      acc[field.id] = field.type === 'checkbox' ? false : '';
      return acc;
    }, {});
  };

  const isFieldEmpty = (value: FormValue) => {
    if (typeof value === 'boolean') return !value;
    return !String(value || '').trim();
  };

  const validateFieldSet = (fields: RegistrationField[], values: Record<string, FormValue>, title: string) => {
    for (const field of fields) {
      if (!field.required) continue;
      if (isFieldEmpty(values[field.id])) {
        return `${title}: ${field.label} is required.`;
      }
    }
    return null;
  };

  // Extract eventCode from params (format: event_XXXXXX)
  useEffect(() => {
    if (params && params.id) {
      const paramId = Array.isArray(params.id) ? params.id[0] : params.id;
      
      // Check if it's an 8-character code (alphanumeric) or UUID
      if (paramId.length === 8 && /^[0-9a-z]+$/.test(paramId)) {
        setEventCode(paramId);
      } else {
        // Fallback for UUID format (backward compatibility)
        setEventId(paramId);
      }
    }
  }, [params]);

  // Fetch data when eventCode is available
  useEffect(() => {
    if (eventCode || eventId) {
      fetchEvent();
      fetchColleges();
    }
  }, [eventCode, eventId]);

  const fetchColleges = async () => {
    try {
      const response = await fetch('/api/colleges');
      if (!response.ok) return;

      const data = await response.json();
      const collegeItems = data?.data?.colleges || data?.data || data?.colleges || [];

      if (Array.isArray(collegeItems)) {
        const normalized = collegeItems
          .filter((item: any) => item?.id && item?.name)
          .map((item: any) => ({ id: String(item.id), name: String(item.name) }));

        const hasAnits = normalized.some((college) => college.name.toLowerCase() === 'anits');
        const withFallbacks = hasAnits
          ? normalized
          : [{ id: 'fallback-anits', name: 'ANITS' }, ...normalized];

        withFallbacks.push({ id: 'fallback-other', name: 'Other' });

        const deduped = Array.from(
          new Map(withFallbacks.map((college) => [college.name.toLowerCase(), college])).values()
        );

        setColleges(deduped);
      }
    } catch (error) {
      console.error('Failed to fetch colleges:', error);
    }
  };

  const fetchEvent = async () => {
    const identifier = eventCode || eventId;
    if (!identifier) return;
    
    try {
      // Use eventCode if available, otherwise fallback to eventId
      const endpoint = eventCode 
        ? `/api/events/code/${eventCode}` 
        : `/api/events/${eventId}`;
      
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        const eventData = data.data || data.event;
        if (!eventData) {
          router.push('/browse');
          return;
        }

        const currentParamId = Array.isArray(params.id) ? params.id[0] : params.id;
        if (eventData.eventCode && currentParamId !== eventData.eventCode) {
          router.replace(`/events/${eventData.eventCode}`);
        }

        setEvent(eventData);
        // Store the actual event ID for registration/bookmark APIs
        setEventId(eventData.id);
        setIsLive(eventData.isLive || false);
        
        // Parse registration source
        if (eventData.customRegistrationFields) {
          try {
            const customFields = JSON.parse(eventData.customRegistrationFields);
            if (customFields.registrationSource) {
              setRegistrationSource(customFields.registrationSource);
            }
            if (customFields.externalFormUrl) {
              setExternalFormUrl(customFields.externalFormUrl);
            }
            const fields: RegistrationField[] = Array.isArray(customFields.fields)
              ? customFields.fields
              : [];
            setRegistrationFields(fields);
            setLeaderFormData(buildDefaultFormData(fields));
            setTeamMembers([]);

            if (customFields.teamConfig?.mode === 'FIXED') {
              setTeamSizeMode('FIXED');
            } else {
              setTeamSizeMode('VARIABLE');
            }
          } catch (e) {
            console.error('Failed to parse custom registration fields:', e);
          }
        }

        if (eventData.registrationType === 'TEAM') {
          setRegistrationType('TEAM');
        } else {
          setRegistrationType('SOLO');
        }
        setTeamRequired(Boolean(eventData.teamRequired));
        setMinTeamSize(Number(eventData.minTeamSize || 1));
        setMaxTeamSize(Number(eventData.maxTeamSize || 1));
        
        checkRegistration(eventData.id);
        checkBookmark(eventData.id);
        // Check if current user is the organizer
        setIsOrganizerOfEvent(!!user?.id && user.id === eventData.organiserId);
      } else {
        router.push('/browse');
      }
    } catch (error) {
      console.error('Failed to fetch event:', error);
      router.push('/browse');
    } finally {
      setLoading(false);
    }
  };

  const checkRegistration = async (eid: string) => {
    try {
      const response = await fetch(`/api/events/${eid}/register`);
      if (response.ok) {
        const data = await response.json();
        if (data?.isRegistered) {
          setIsRegistered(true);
          const qrFromApi = data?.data?.qrCode || null;
          if (qrFromApi) {
            setQrCode(qrFromApi);
          }
        }
      }
    } catch (error) {
      console.error('Failed to check registration:', error);
    }
  };

  const checkBookmark = async (eid: string) => {
    try {
      const response = await fetch(`/api/events/${eid}/bookmark`);
      if (response.ok) {
        const data = await response.json();
        setIsBookmarked(data.isBookmarked);
      }
    } catch (error) {
      console.error('Failed to check bookmark:', error);
    }
  };

  const handleRegister = async () => {
    if (!eventId) {
      alert('Event ID is missing. Please refresh and try again.');
      return;
    }

    if (isOrganizerOfEvent) {
      alert('You cannot register as you are the organizer of this event.');
      return;
    }
    
    // If Google Form registration, show popup
    if (registrationSource === 'GOOGLE_FORM') {
      setShowGoogleFormPopup(true);
      return;
    }
    
    // If website registration, show the registration form modal
    setLeaderFormData(buildDefaultFormData(registrationFields));
    setTeamMembers([]);
    setTransactionId('');
    setPaymentScreenshot(null);
    setPaymentScreenshotPreview(null);
    setShowRegistrationModal(true);
  };

  const updateLeaderValue = (fieldId: string, value: FormValue) => {
    setLeaderFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const addTeamMember = () => {
    setTeamMembers((prev) => [...prev, buildDefaultFormData(registrationFields)]);
  };

  const updateTeamMemberValue = (index: number, fieldId: string, value: FormValue) => {
    setTeamMembers((prev) =>
      prev.map((member, memberIndex) =>
        memberIndex === index ? { ...member, [fieldId]: value } : member
      )
    );
  };

  const removeTeamMember = (index: number) => {
    setTeamMembers((prev) => prev.filter((_, memberIndex) => memberIndex !== index));
  };

  const handlePaymentScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentScreenshot(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWebsiteRegistration = async () => {
    if (!eventId) {
      alert('Event ID is missing. Please refresh and try again.');
      return;
    }
    try {
      const leaderError = validateFieldSet(registrationFields, leaderFormData, 'Team leader');
      if (leaderError) {
        alert(leaderError);
        return;
      }

      // Validate payment fields if event is paid
      if (event?.isPaid) {
        if (!transactionId.trim()) {
          alert('Please enter your transaction ID.');
          return;
        }
        if (!paymentScreenshot) {
          alert('Please upload a payment screenshot.');
          return;
        }
      }

      if (registrationType === 'TEAM') {
        const memberCount = teamMembers.length + 1;
        const minAllowed = Math.max(minTeamSize, 1);
        const maxAllowed = Math.max(maxTeamSize, minAllowed);

        if (teamRequired && memberCount < minAllowed) {
          alert(`Add at least ${minAllowed - 1} team member(s).`);
          return;
        }

        if (memberCount > maxAllowed) {
          alert(`Team size cannot exceed ${maxAllowed} participants.`);
          return;
        }

        for (let i = 0; i < teamMembers.length; i++) {
          const memberError = validateFieldSet(registrationFields, teamMembers[i], `Team member ${i + 2}`);
          if (memberError) {
            alert(memberError);
            return;
          }
        }
      }

      // Convert screenshot to base64 if payment required
      let paymentScreenshotBase64 = '';
      if (paymentScreenshot) {
        paymentScreenshotBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(paymentScreenshot);
        });
      }

      const response = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customFieldsData: {
            registrationType,
            leader: leaderFormData,
            teamMembers: registrationType === 'TEAM' ? teamMembers : [],
          },
          paymentScreenshot: paymentScreenshotBase64 || null,
          transactionId: transactionId || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const qrFromApi = data?.data?.qrCode || data?.qrCode || null;
        if (qrFromApi) {
          setQrCode(qrFromApi);
        }
        setIsRegistered(true);
        setShowRegistrationModal(false);
        // Reset form
        setTransactionId('');
        setPaymentScreenshot(null);
        setPaymentScreenshotPreview(null);
        alert('Successfully registered for the event!');
      } else {
        const data = await response.json();
        alert(data.error || data.message || 'Failed to register');
      }
    } catch (error) {
      console.error('Failed to register:', error);
      alert('Failed to register for event');
    }
  };
  
  
  const handleGoogleFormComplete = () => {
    setShowGoogleFormPopup(false);
    alert('Thank you! Please ensure you have filled out the Google Form.');
  };

  const handleBookmarkToggle = async () => {
    if (!eventId) {
      alert('Event ID is missing. Please refresh and try again.');
      return;
    }
    try {
      const response = await fetch(`/api/events/${eventId}/bookmark`, {
        method: isBookmarked ? 'DELETE' : 'POST',
      });

      if (response.ok) {
        setIsBookmarked(!isBookmarked);
      } else {
        alert('Failed to update bookmark');
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
      alert('Failed to update bookmark');
    }
  };

  const handleGoLiveToggle = async () => {
    if (!eventId) {
      alert('Event ID is missing. Please refresh and try again.');
      return;
    }
    try {
      const response = await fetch(`/api/events/${eventId}/live`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLive: !isLive }),
      });

      if (response.ok) {
        setIsLive(!isLive);
        alert(isLive ? 'Event is no longer live' : 'Event is now live!');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update live status');
      }
    } catch (error) {
      console.error('Failed to toggle live status:', error);
      alert('Failed to update live status');
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventId) {
      alert('Event ID is missing. Please refresh and try again.');
      return;
    }

    const confirmed = window.confirm('Are you sure you want to delete this event? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Event deleted successfully');
        router.push('/organizer/my-events');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete event');
      }
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert('Failed to delete event');
    }
  };

  const handleCopyEventLink = async () => {
    if (!event) {
      return;
    }

    const link = `${window.location.origin}/events/${event.eventCode || event.id}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1600);
    } catch (error) {
      console.error('Failed to copy event link:', error);
      alert('Failed to copy link');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-ink text-white flex items-center justify-center">
        <div>Event not found</div>
      </div>
    );
  }

  let visibilityInfo = 'Open to Everyone';
  if (event.customRegistrationFields) {
    try {
      const customFields = JSON.parse(event.customRegistrationFields);
      if (customFields.visibility) {
        const { mode, collegeNames } = customFields.visibility;
        if (mode === 'College' && collegeNames && collegeNames.length > 0) {
          visibilityInfo = `Open to ${collegeNames[0]}`;
        } else if (mode === 'Custom' && collegeNames && collegeNames.length > 0) {
          visibilityInfo = `Open to ${collegeNames.join(', ')}`;
        }
      }
    } catch (e) {
      console.error('Failed to parse visibility info:', e);
    }
  }

  const tags = (event.tags || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

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

  const toEmbedMapUrl = (input: string): string => {
    if (!input) return '';

    const cleaned = input.trim();
    const iframeSrc = extractIframeSrc(cleaned);
    if (iframeSrc) {
      return iframeSrc;
    }

    const urlMatch = cleaned.match(/https?:\/\/[^\s]+/i);
    const directUrl = urlMatch?.[0] || '';
    const rawLocation = directUrl ? cleaned.replace(directUrl, '').trim() : cleaned;

    if (directUrl) {
      try {
        const parsed = new URL(directUrl);
        const host = parsed.hostname.toLowerCase();
        const isGoogleHost = host.includes('google.') || host.includes('goo.gl');

        if (isGoogleHost && parsed.pathname.includes('/maps/embed')) {
          return parsed.toString();
        }

        if (isGoogleHost) {
          // Build a stable embed URL instead of forwarding short/share links directly.
          return `https://maps.google.com/maps?q=${encodeURIComponent(parsed.toString())}&output=embed`;
        }
      } catch {
        // ignore malformed URL and fallback to text query if available
      }
    }

    if (rawLocation) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(rawLocation)}&output=embed`;
    }

    return '';
  };

  const venueRaw = event.venue?.trim() || '';
  let locationInfoFromConfig = '';
  let mapFromConfig = '';
  if (event.customRegistrationFields) {
    try {
      const parsed = JSON.parse(event.customRegistrationFields);
      locationInfoFromConfig = parsed?.location?.info || '';
      mapFromConfig = parsed?.location?.mapLink || '';
    } catch {
      // Keep backward compatibility when metadata is unavailable or malformed.
    }
  }
  const venueTextOnly = stripHtml(locationInfoFromConfig || venueRaw);
  const hasLocationUrl = /https?:\/\//i.test(venueRaw) || /<iframe/i.test(venueRaw);
  const venueText = venueTextOnly || (hasLocationUrl ? 'Details not provided. Check map below.' : 'Details not provided');
  const mapEmbedUrl = toEmbedMapUrl(mapFromConfig || venueRaw);
  const shareEventUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/events/${event.eventCode || event.id}`;

  const maxMembersAllowed = Math.max(maxTeamSize - 1, 0);

  return (
    <div className="min-h-screen overflow-x-hidden bg-ink text-white">
      <header className="border-b border-white/10 bg-black/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 sm:px-6">
          <Link href="/browse" className="text-sm text-neon hover:underline">
            ← Events
          </Link>
          {event.eventCode && (
            <span className="rounded-md border border-white/20 bg-black/65 px-2.5 py-1 text-xs text-white">
              Code: {event.eventCode}
            </span>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl overflow-x-hidden px-5 py-8 sm:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[360px_1fr]">
          <aside className="space-y-5">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black relative">
              {event.bannerUrl ? (
                <button
                  type="button"
                  onClick={() => setShowPosterPreview(true)}
                  className="group relative block w-full"
                >
                  <img
                    src={event.bannerUrl}
                    alt={event.title}
                    className="h-[280px] w-full object-cover"
                  />
                </button>
              ) : (
                <div className="flex h-[280px] items-center justify-center bg-black relative">
                  <svg className="h-16 w-16 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <button
                onClick={handleBookmarkToggle}
                className="absolute left-3 top-3 z-10 rounded-lg bg-black/70 p-2 backdrop-blur-sm transition hover:bg-black/80"
                aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
              >
                {isBookmarked ? (
                  <svg className="h-6 w-6 fill-yellow-400 text-yellow-400" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                )}
              </button>
            </div>

            <section className="rounded-2xl border border-white/10 bg-black p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Organised By</p>
              <div className="flex items-center gap-3">
                {event.organiser.profile?.profilePhoto ? (
                  <img
                    src={event.organiser.profile.profilePhoto}
                    alt={`${event.organiser.firstName} ${event.organiser.lastName}`}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neon/15 text-sm font-semibold text-neon">
                    {event.organiser.firstName.charAt(0)}
                    {event.organiser.lastName.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">
                    {event.organiser.firstName} {event.organiser.lastName}
                  </p>
                  <p className="text-xs text-muted">{event.organiser.email}</p>
                </div>
              </div>
              {tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-white/15 px-2.5 py-1 text-xs text-muted">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-white/10 bg-black p-4">
              <h2 className="mb-2 text-sm font-semibold">Location Info</h2>
              <p className="max-w-full break-all text-sm text-muted">{venueText || 'Details not provided'}</p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-black p-4">
              <h2 className="mb-3 text-sm font-semibold">Location Map</h2>
              {mapEmbedUrl ? (
                <div className="overflow-hidden rounded-xl border border-white/10">
                  <iframe
                    src={mapEmbedUrl}
                    width="100%"
                    height="190"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full"
                  />
                </div>
              ) : (
                <p className="text-sm text-muted">Not added</p>
              )}
              <div className="mt-3 rounded-lg border border-white/10 bg-black/30 p-2.5">
                <p className="mb-1 text-[11px] uppercase tracking-wide text-soft">Share Event Link</p>
                <div className="flex items-center gap-2">
                  <input
                    value={shareEventUrl}
                    readOnly
                    className="w-full rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-muted"
                  />
                  <button
                    type="button"
                    onClick={handleCopyEventLink}
                    className="rounded-md border border-white/20 px-2.5 py-1.5 text-xs text-white transition hover:bg-white/10"
                  >
                    {copiedLink ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </section>
          </aside>

          <section className="min-w-0 space-y-6">
            <div>
              {isLive && (
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-400">
                  <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                  LIVE NOW
                </div>
              )}
              {!isLive && (
                <div className="mb-3 inline-flex items-center rounded-full border border-neon/30 bg-neon/10 px-3 py-1 text-xs text-neon">
                  {visibilityInfo}
                </div>
              )}
              <h1 className="text-3xl font-bold leading-tight sm:text-5xl">{event.title}</h1>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black p-5">
              <h2 className="mb-3 text-sm font-semibold">About Event</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">
                {event.description || 'No description provided.'}
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/10 bg-black p-4">
              <div className="flex items-start justify-between gap-6">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-md border border-white/15 px-2 py-1 text-xs text-muted">
                    {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      {new Date(event.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-sm text-muted">
                      {new Date(event.date).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted mb-1">Registration Type</p>
                  <p className="text-sm font-semibold whitespace-nowrap">
                    {registrationType === 'SOLO' ? (
                      'Solo'
                    ) : minTeamSize === maxTeamSize ? (
                      `Fixed Team (${minTeamSize})`
                    ) : (
                      `Team (${minTeamSize}-${maxTeamSize})`
                    )}
                  </p>
                </div>
              </div>
              {event.isPaid && event.ticketPrice && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-neon/30 bg-neon/5 px-4 py-2.5">
                  <svg className="h-5 w-5 text-neon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-xs text-neon/80">Registration Fee</p>
                    <p className="text-sm font-semibold text-neon">₹{Number(event.ticketPrice).toFixed(2)}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black p-4">
              <h2 className="mb-3 text-sm font-semibold">Registration</h2>
              <p className="mb-3 text-sm text-muted">
                {isRegistered ? 'You are registered for this event.' : 'Welcome! To join the event, please register below.'}
              </p>

              {!isRegistered ? (
                <button
                  onClick={handleRegister}
                  className="w-full rounded-lg bg-white py-2.5 text-sm font-semibold text-black hover:bg-white/90 transition"
                >
                  Click here to register
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-green-500/40 bg-green-500/10 py-2.5 text-center text-sm font-semibold text-green-400">
                    <span className="inline-flex items-center gap-1.5">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Registered
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowQrPopup(true)}
                    disabled={!qrCode}
                    className="rounded-lg border border-white/20 bg-white/5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    View QR
                  </button>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between text-xs text-muted">
                <span>{event._count.registrations} registered</span>
                {event.capacity < 9999 && (
                  <span>{Math.max(event.capacity - event._count.registrations, 0)} spots left</span>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                {isOrganizerOfEvent && (
                  <>
                    <Link
                      href={`/events/${event?.eventCode || eventCode || eventId}/attendance`}
                      className="flex-1 rounded-lg border border-white/25 py-2 text-center text-sm hover:bg-white/5 transition"
                    >
                      Attendance
                    </Link>
                    <button
                      onClick={handleGoLiveToggle}
                      className={`flex-1 rounded-lg border py-2 text-sm transition font-medium ${
                        isLive
                          ? 'border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                          : 'border-neon bg-neon/10 text-neon hover:bg-neon/20'
                      }`}
                    >
                      {isLive ? (
                        <span className="flex items-center justify-center gap-1.5">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
                          End Live
                        </span>
                      ) : (
                        'Go Live'
                      )}
                    </button>
                    <Link
                      href={`/events/create?edit=${event.eventCode || event.id}`}
                      className="flex-1 rounded-lg border border-white/25 py-2 text-center text-sm hover:bg-white/5 transition"
                    >
                      Edit Event
                    </Link>
                    <button
                      onClick={handleDeleteEvent}
                      className="flex-1 rounded-lg border border-red-500/30 py-2 text-sm text-red-300 transition hover:bg-red-500/10"
                    >
                      Delete Event
                    </button>
                    <Link
                      href={`/events/${event?.eventCode || eventCode || eventId}/analytics`}
                      className="flex-1 rounded-lg border border-blue-500/30 py-2 text-center text-sm text-blue-300 transition hover:bg-blue-500/10"
                    >
                      Analytics
                    </Link>
                  </>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      {showRegistrationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-white/10 bg-black p-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <h2 className="mb-4 text-2xl font-bold">Register for {event.title}</h2>
            <p className="mb-6 text-muted">
              Fill in your details below. Your registration will be saved and you will receive a QR code for check-in.
            </p>

            {registrationFields.length > 0 && (
              <div className="mb-5 space-y-4">
                <div className="rounded-lg border border-white/10 bg-black/30 p-4">
                  <h3 className="mb-3 text-sm font-semibold">Team Leader Details</h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {registrationFields.map((field) => (
                      <div key={`leader_${field.id}`} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                        <label htmlFor={`leader_${field.id}`} className="mb-1.5 block text-xs text-muted">
                          {field.label}
                          {field.required ? ' *' : ''}
                        </label>
                        <FieldInput
                          field={field}
                          value={leaderFormData[field.id]}
                          onChange={(nextValue) => updateLeaderValue(field.id, nextValue)}
                          keyPrefix="leader"
                          colleges={colleges}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {registrationType === 'TEAM' && (
                  <div className="rounded-lg border border-white/10 bg-black/30 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold">Team Members</h3>
                        <p className="text-xs text-muted">
                          {teamSizeMode === 'FIXED'
                            ? `Fixed team size: ${minTeamSize}`
                            : `Team size: ${minTeamSize} to ${maxTeamSize}`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addTeamMember}
                        disabled={teamMembers.length >= maxMembersAllowed}
                        className="rounded-lg border border-white/15 px-3 py-2 text-xs transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Add Team Member
                      </button>
                    </div>

                    {teamMembers.length === 0 && (
                      <p className="text-xs text-soft">No team members added yet.</p>
                    )}

                    <div className="space-y-4">
                      {teamMembers.map((member, memberIndex) => (
                        <div key={`member_${memberIndex}`} className="rounded-lg border border-white/10 bg-black/35 p-3">
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                              Team Member {memberIndex + 2}
                            </p>
                            <button
                              type="button"
                              onClick={() => removeTeamMember(memberIndex)}
                              className="text-xs text-red-400 hover:text-red-300"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {registrationFields.map((field) => (
                              <div key={`member_${memberIndex}_${field.id}`} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                                <label
                                  htmlFor={`member_${memberIndex}_${field.id}`}
                                  className="mb-1.5 block text-xs text-muted"
                                >
                                  {field.label}
                                  {field.required ? ' *' : ''}
                                </label>
                                <FieldInput
                                  field={field}
                                  value={member[field.id]}
                                  onChange={(nextValue) => updateTeamMemberValue(memberIndex, field.id, nextValue)}
                                  keyPrefix={`member_${memberIndex}`}
                                  colleges={colleges}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {event?.isPaid && (
              <div className="mb-5 rounded-lg bg-black/30 p-4">
                <h3 className="mb-3 text-sm font-semibold">Payment Details</h3>
                <p className="mb-4 text-xs text-muted">
                  Registration fee: <span className="font-semibold text-neon">₹{event.ticketPrice}</span>
                </p>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="transactionId" className="mb-1.5 block text-xs text-muted">
                      Transaction ID *
                    </label>
                    <input
                      id="transactionId"
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Enter your transaction ID"
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm transition focus:border-neon focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="paymentScreenshot" className="mb-1.5 block text-xs text-muted">
                      Payment Screenshot *
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        id="paymentScreenshot"
                        type="file"
                        accept="image/*"
                        onChange={handlePaymentScreenshotChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="paymentScreenshot"
                        className="cursor-pointer rounded-lg bg-neon px-3 py-2 text-xs font-semibold text-black transition hover:bg-neon/85"
                      >
                        Upload File
                      </label>
                      <span className="text-xs text-muted">
                        {paymentScreenshot ? paymentScreenshot.name : 'No file selected'}
                      </span>
                      {paymentScreenshotPreview && (
                        <button
                          type="button"
                          onClick={() => {
                            window.open(paymentScreenshotPreview, '_blank');
                          }}
                          className="rounded-lg bg-white/10 px-3 py-2 text-xs hover:bg-white/20 transition"
                        >
                          Preview
                        </button>
                      )}
                    </div>
                    {paymentScreenshotPreview && (
                      <p className="mt-1.5 text-xs text-neon">✓ Screenshot uploaded</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleWebsiteRegistration}
                className="flex-1 rounded-lg bg-neon px-4 py-2 font-semibold text-black hover:bg-neon/85 transition"
              >
                Confirm Registration
              </button>
              <button
                onClick={() => {
                  setShowRegistrationModal(false);
                  setTransactionId('');
                  setPaymentScreenshot(null);
                  setPaymentScreenshotPreview(null);
                }}
                className="flex-1 rounded-lg border border-white/15 px-4 py-2 hover:bg-white/5 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showGoogleFormPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-black p-6">
            <h2 className="mb-4 text-2xl font-bold">Complete Registration</h2>
            <p className="mb-4 text-muted">Please fill out the Google Form to complete your registration.</p>
            <a
              href={externalFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-3 block w-full rounded-lg bg-blue-600 px-4 py-3 text-center font-semibold text-white hover:bg-blue-700 transition"
            >
              Open Google Form →
            </a>
            <div className="flex gap-3">
              <button
                onClick={handleGoogleFormComplete}
                className="flex-1 rounded-lg bg-neon px-4 py-2 font-semibold text-black hover:bg-neon/85 transition"
              >
                I Filled the Form
              </button>
              <button
                onClick={() => setShowGoogleFormPopup(false)}
                className="flex-1 rounded-lg border border-white/15 px-4 py-2 hover:bg-white/5 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showPosterPreview && event.bannerUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <button
            type="button"
            onClick={() => setShowPosterPreview(false)}
            className="absolute right-6 top-6 rounded-md border border-white/20 bg-black/60 px-3 py-1.5 text-sm text-white hover:bg-black/80"
          >
            Close
          </button>
          <img
            src={event.bannerUrl}
            alt={event.title}
            className="max-h-[90vh] max-w-[92vw] rounded-xl border border-white/15 object-contain"
          />
        </div>
      )}

      {showQrPopup && qrCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <button
            type="button"
            onClick={() => setShowQrPopup(false)}
            className="absolute right-6 top-6 rounded-md border border-white/20 bg-black/60 px-3 py-1.5 text-sm text-white hover:bg-black/80"
          >
            Close
          </button>
          <div className="w-full max-w-sm rounded-xl border border-white/15 bg-black p-5 text-center">
            <p className="mb-3 text-sm text-muted">Show this QR at check-in</p>
            <img src={qrCode} alt="QR Code" className="mx-auto h-64 w-64 rounded-lg border border-white/10 bg-white p-2" />
          </div>
        </div>
      )}
    </div>
  );
}
