'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/auth-context';
import type { AppUser, ProfileInfo } from '@/types';
import type { CustomField } from '@/types';

const DEFAULT_REGISTRATION_FIELDS: CustomField[] = [
  {
    id: 'default_college',
    label: 'College',
    type: 'text',
    required: true,
    placeholder: 'Enter your college name',
  },
  {
    id: 'default_registration_no',
    label: 'Registration No',
    type: 'text',
    required: true,
    placeholder: 'Enter your registration number',
  },
];

const withDefaultFields = (fields: CustomField[]) => {
  const filtered = fields.filter(
    (field) => field.id !== 'default_college' && field.id !== 'default_registration_no'
  );
  return [...DEFAULT_REGISTRATION_FIELDS, ...filtered];
};

const normalizeFieldType = (value: unknown): CustomField['type'] => {
  const type = String(value || 'text').toLowerCase().trim();
  if (type === 'tel' || type === 'mobile') return 'phone';
  if (type === 'select' || type === 'radio') return 'dropdown';
  if (type === 'longtext') return 'textarea';
  if (type === 'boolean' || type === 'toggle') return 'checkbox';
  if (type === 'datetime' || type === 'datetime-local') return 'date';
  if (['text', 'email', 'phone', 'number', 'dropdown', 'checkbox', 'date', 'textarea'].includes(type)) {
    return type as CustomField['type'];
  }
  return 'text';
};

const normalizeOptions = (value: unknown): string[] | undefined => {
  if (Array.isArray(value)) {
    const options = value
      .map((item) => String(item ?? '').trim())
      .filter(Boolean);
    return options.length > 0 ? options : undefined;
  }

  if (typeof value === 'string') {
    const options = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    return options.length > 0 ? options : undefined;
  }

  return undefined;
};

const normalizeCustomFields = (rawFields: unknown): CustomField[] => {
  if (!Array.isArray(rawFields)) {
    return [];
  }

  return rawFields
    .map((raw, idx) => {
      const field = (raw || {}) as Record<string, unknown>;
      const label = String(
        field.label || field.name || field.title || field.question || field.fieldName || ''
      ).trim();
      const idBase = String(field.id || field.key || field.fieldId || '').trim();
      const idFromLabel = label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

      const id = idBase || idFromLabel || `field_${idx + 1}`;
      if (!label) {
        return null;
      }

      return {
        id,
        label,
        type: normalizeFieldType(field.type || field.fieldType || field.inputType),
        required: Boolean(field.required ?? field.isRequired ?? field.mandatory),
        placeholder: String(field.placeholder || field.placeholderText || field.hint || '').trim() || undefined,
        options: normalizeOptions(field.options ?? field.values ?? field.choices),
      } as CustomField;
    })
    .filter((field): field is CustomField => Boolean(field));
};

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  venue: string;
  capacity: number;
  bannerUrl?: string;
  isPaid: boolean;
  ticketPrice?: number;
  registrationType: string;
  teamRequired: boolean;
  minTeamSize: number;
  maxTeamSize: number;
  customRegistrationFields?: string;
}

export default function RegisterForEventPage() {
  const router = useRouter();
  const params = useParams();
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<AppUser | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [registrationSource, setRegistrationSource] = useState<'WEBSITE' | 'GOOGLE_FORM'>('WEBSITE');
  const [externalFormUrl, setExternalFormUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    loadUser();
    loadEvent();
  }, [params.id]);

  useEffect(() => {
    if (!user || customFields.length === 0) {
      console.log('[Prefill] Waiting for user or customFields', { user: !!user, fieldsCount: customFields.length });
      return;
    }

    console.log('[Prefill] Starting prefill');
    console.log('[Prefill]   user:', user);
    console.log('[Prefill]   profile:', profile);
    console.log('[Prefill]   fields:', customFields.length, customFields.map(f => `${f.label}(${f.id})`));

    setFormData((prev) => {
      const next = { ...prev };
      let filledCount = 0;

      for (const field of customFields) {
        if (next[field.id] !== undefined && next[field.id] !== '') {
          continue;
        }

        const prefilled = getPrefilledValue(field, user, profile);
        if (prefilled !== undefined && prefilled !== null && prefilled !== '') {
          next[field.id] = prefilled;
          filledCount++;
          console.log(`[Prefill] ✓ ${field.label} => "${prefilled}"`);
        } else {
          console.log(`[Prefill] ✗ ${field.label} => (empty)`);
        }
      }

      console.log(`[Prefill] Filled ${filledCount}/${customFields.length} fields`);
      return next;
    });
  }, [customFields, user, profile]);

  const getPrefilledValue = (field: CustomField, currentUser: AppUser, currentProfile: ProfileInfo | null) => {
    const fieldId = String(field.id || '').toLowerCase();
    const label = String(field.label || '').toLowerCase();
    const text = `${fieldId} ${label}`;

    // Avoid filling teammate/member-specific inputs.
    if (/member|teammate|participant\s*[2-9]/i.test(text)) {
      return undefined;
    }

    const fallbackName = (currentUser.name || '').trim();
    const firstName = (currentUser.firstName || currentProfile?.firstName || '').trim();
    const lastName = (currentUser.lastName || currentProfile?.lastName || '').trim();
    const fullName = `${firstName} ${lastName}`.trim() || fallbackName;
    const email = (currentUser.email || currentProfile?.email || '').trim() || undefined;
    const college = (currentProfile?.college || '').trim() || undefined;
    const collegeId = (currentProfile?.collegeId || currentUser.collegeId || '').trim() || undefined;
    const branch = (currentProfile?.branch === 'OTHER' ? (currentProfile?.customBranch || '') : (currentProfile?.branch || '')).trim() || undefined;
    const whatsapp = (currentProfile?.whatsapp || '').trim() || undefined;
    const yearMap: Record<number, string> = {
      1: '1st Year',
      2: '2nd Year',
      3: '3rd Year',
      4: '4th Year',
      5: '5th Year',
    };

    const dob = currentProfile?.dateOfBirth
      ? new Date(currentProfile.dateOfBirth).toISOString().split('T')[0]
      : undefined;

    const matchOption = (candidate?: string) => {
      if (!candidate || !field.options || field.options.length === 0) {
        return candidate;
      }

      const normalizedCandidate = candidate.toLowerCase().trim();
      const exact = field.options.find((opt) => opt.toLowerCase().trim() === normalizedCandidate);
      if (exact) {
        return exact;
      }

      const partial = field.options.find((opt) => {
        const n = opt.toLowerCase().trim();
        return n.includes(normalizedCandidate) || normalizedCandidate.includes(n);
      });

      return partial || candidate;
    };

    const hasAny = (...tokens: string[]) => tokens.some((token) => text.includes(token));

    // Strong matches by system field IDs and custom field ID patterns.
    // Handle both default_* format and generated IDs from custom fields
    if (fieldId.includes('full_name') || fieldId.includes('fullname')) return fullName || undefined;
    if (fieldId.includes('email')) return email;
    if (fieldId.includes('whatsapp') || fieldId.includes('phone') || fieldId.includes('mobile')) return whatsapp;
    if (fieldId.includes('college') && !fieldId.includes('_id') && !fieldId.includes('registration')) return college;
    if (fieldId.includes('registration') || fieldId.includes('reg_no') || fieldId.includes('regist')) return collegeId;
    if (fieldId.includes('year') || fieldId.includes('semester')) {
      const yearLabel = currentProfile?.year ? yearMap[currentProfile.year] || String(currentProfile.year) : undefined;
      return matchOption(yearLabel);
    }
    if (fieldId.includes('branch') || fieldId.includes('department')) {
      return matchOption(branch);
    }

    // Fallbacks by label for custom fields.
    if ((hasAny('full name', 'full_name', 'student name', 'applicant name') || (hasAny('name') && !hasAny('team', 'member', 'participant', 'event', 'organization'))) && fullName) {
      return fullName;
    }
    if (hasAny('email', 'mail id', 'email id') && email) return email;
    if (hasAny('whatsapp', 'phone', 'mobile', 'contact', 'telephone') && whatsapp) return whatsapp;
    if (hasAny('roll', 'registration no', 'registration number', 'college id', 'reg no', 'reg_no')) {
      return collegeId;
    }
    if (hasAny('year', 'semester', 'sem')) {
      const yearLabel = currentProfile?.year ? yearMap[currentProfile.year] || String(currentProfile.year) : undefined;
      return matchOption(yearLabel);
    }
    if (hasAny('branch', 'department', 'dept')) {
      return matchOption(branch);
    }
    if (hasAny('college', 'institute', 'university') && !hasAny('college id')) return college;
    if (hasAny('gender', 'sex')) return matchOption(currentProfile?.gender || undefined);
    if (hasAny('date of birth', 'dob', 'birth')) return dob;
    if (hasAny('city')) return currentProfile?.city || undefined;
    if (hasAny('state')) return currentProfile?.state || undefined;
    if (hasAny('country')) return currentProfile?.country || undefined;

    return undefined;
  };

  const loadUser = async () => {
    try {
      if (!authUser) {
        router.push('/login');
        return;
      }

      const profileResponse = await fetch('/api/profile/complete');

      const fullName = (authUser?.name || '').trim();
      const [firstNameFromName = '', ...rest] = fullName.split(/\s+/).filter(Boolean);
      const lastNameFromName = rest.join(' ');
      setUser({
        ...authUser,
        firstName: authUser.firstName || firstNameFromName,
        lastName: authUser.lastName || lastNameFromName,
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        console.log('[Profile Load] Raw profileData:', profileData);
        
        // Merge profile data - handle case where profile might be null
        const profileObj = profileData.profile || {};
        const mergedProfile: ProfileInfo = {
          ...profileObj,
          firstName: profileData.firstName || profileObj.firstName,
          lastName: profileData.lastName || profileObj.lastName,
          email: profileData.email || profileObj.email,
          college: profileObj.college || profileData.college,
          collegeId: profileObj.collegeId || profileData.collegeId || authUser.collegeId,
          whatsapp: profileObj.whatsapp,
          gender: profileObj.gender,
          dateOfBirth: profileObj.dateOfBirth,
          year: profileObj.year,
          branch: profileObj.branch,
          customBranch: profileObj.customBranch,
          city: profileObj.city,
          state: profileObj.state,
          country: profileObj.country,
        };
        console.log('[Profile Load] Merged profile:', mergedProfile);
        console.log('[Profile Load] Key fields - college:', mergedProfile.college, 'year:', mergedProfile.year, 'branch:', mergedProfile.branch, 'whatsapp:', mergedProfile.whatsapp);
        setProfile(mergedProfile);
      } else {
        console.warn('[Profile Load] Profile response not OK:', profileResponse.status);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      router.push('/login');
    }
  };

  const loadEvent = async () => {
    try {
      const response = await fetch(`/api/events/${params.id}`);
      if (!response.ok) {
        router.push('/browse');
        return;
      }
      const data = await response.json();
      const eventData = data.data?.event || data.event;
      console.log('[Event Load] Event data:', eventData);
      console.log('[Event Load] registrationType:', eventData?.registrationType, 'minTeam:', eventData?.minTeamSize, 'maxTeam:', eventData?.maxTeamSize);
      setEvent(eventData);

      // Parse custom registration fields
      if (eventData.customRegistrationFields) {
        try {
          const parsed =
            typeof eventData.customRegistrationFields === 'string'
              ? JSON.parse(eventData.customRegistrationFields)
              : eventData.customRegistrationFields;

          if (Array.isArray(parsed)) {
            setCustomFields(withDefaultFields(normalizeCustomFields(parsed)));
          } else if (parsed && typeof parsed === 'object') {
            const parsedObj = parsed as Record<string, unknown>;
            const source =
              parsedObj.registrationSource === 'GOOGLE_FORM' || parsedObj.mode === 'GOOGLE_FORM'
                ? 'GOOGLE_FORM'
                : 'WEBSITE';
            const formUrl =
              typeof parsedObj.externalFormUrl === 'string'
                ? parsedObj.externalFormUrl
                : typeof parsedObj.googleFormUrl === 'string'
                ? parsedObj.googleFormUrl
                : typeof parsedObj.formUrl === 'string'
                ? parsedObj.formUrl
                : '';
            const rawFields =
              parsedObj.fields ?? parsedObj.customFields ?? parsedObj.registrationFields ?? [];

            setRegistrationSource(source);
            setExternalFormUrl(formUrl);
            setCustomFields(withDefaultFields(normalizeCustomFields(rawFields)));
          }
        } catch (e) {
          console.error('Failed to parse custom fields:', e);
          setCustomFields(withDefaultFields([]));
        }
      } else {
        setCustomFields(withDefaultFields([]));
      }
    } catch (error) {
      console.error('Failed to load event:', error);
      router.push('/browse');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (fieldId: string, value: any) => {
    setFormData({
      ...formData,
      [fieldId]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Validate required fields
      for (const field of customFields) {
        if (field.required && !formData[field.id]) {
          setError(`${field.label} is required`);
          setSubmitting(false);
          return;
        }
      }

      const response = await fetch(`/api/events/${params.id}/register`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customFieldsData: formData,
        }),
      });

      if (response.ok) {
        router.push(`/events/${params.id}`);
      } else {
        const data = await response.json();
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: CustomField) => {
    const commonClasses = "w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg focus:outline-none focus:border-neon transition";

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <input
            type={field.type === 'phone' ? 'tel' : field.type}
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className={commonClasses}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className={commonClasses}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            required={field.required}
            className={commonClasses}
          />
        );

      case 'dropdown':
        return (
          <select
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            required={field.required}
            className={commonClasses}
          >
            <option value="">Select an option</option>
            {field.options?.map((option, idx) => (
              <option key={idx} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={Boolean(formData[field.id])}
              onChange={(e) => handleChange(field.id, e.target.checked)}
              required={field.required}
              className="w-4 h-4"
            />
            <span className="text-sm">{field.placeholder || 'I agree'}</span>
          </label>
        );

      case 'textarea':
        return (
          <textarea
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={4}
            className={`${commonClasses} resize-none`}
          />
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user || !event) {
    return null;
  }

  return (
    <div className="min-h-screen bg-ink text-white flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 w-full px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Register for Event</h1>
            <p className="text-muted">{event.title}</p>
          </div>

          {event.bannerUrl && (
            <div className="mb-8 rounded-xl overflow-hidden h-64">
              <img 
                src={event.bannerUrl} 
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="mb-8 p-6 bg-black/30 rounded-lg border border-white/10">
            <div className="grid grid-cols-2 gap-6 mb-3">
              <div>
                <span className="block text-muted text-sm mb-1">Date & Time</span>
                <span className="block font-medium">{new Date(event.date).toLocaleString()}</span>
              </div>
              <div>
                <span className="block text-muted text-sm mb-1">Registration Type</span>
                <span className="block font-medium">
                  {event.registrationType === 'SOLO' ? (
                    'Solo'
                  ) : event.minTeamSize === event.maxTeamSize ? (
                    `Fixed Team (${event.minTeamSize})`
                  ) : (
                    `Team (${event.minTeamSize}-${event.maxTeamSize})`
                  )}
                </span>
              </div>
            </div>
            <div className="flex justify-between py-3 border-t border-white/10">
              <span className="text-muted">Venue</span>
              <span>{event.venue}</span>
            </div>
            {event.isPaid && event.ticketPrice && (
              <div className="flex justify-between">
                <span className="text-muted">Ticket Price</span>
                <span className="text-neon font-semibold">₹{event.ticketPrice}</span>
              </div>
            )}
            {event.registrationType === 'TEAM' && (
              <div className="flex justify-between">
                <span className="text-muted">Team Size</span>
                <span>{event.minTeamSize} - {event.maxTeamSize} members</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                {error}
              </div>
            )}

            {registrationSource === 'GOOGLE_FORM' && externalFormUrl && (
              <div className="rounded-xl border border-amber-300/30 bg-amber-500/10 p-5">
                <h2 className="text-lg font-semibold text-amber-100">Registration via Google Form</h2>
                <p className="mt-2 text-sm text-amber-100/90">
                  This event uses an external registration form. Click below to continue.
                </p>
                <a
                  href={externalFormUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-200"
                >
                  Open Google Form
                </a>
              </div>
            )}

            {registrationSource === 'GOOGLE_FORM' && !externalFormUrl && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                Registration is configured as Google Form, but the form URL is missing.
              </div>
            )}

            {registrationSource === 'WEBSITE' && (
              <>

            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Registration Information</h2>

              {/* Basic fields - always shown */}
              <div>
                <label className="block text-sm font-medium mb-2">Full Name *</label>
                <input
                  type="text"
                  value={`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || ''}
                  disabled
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg opacity-60"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg opacity-60"
                />
              </div>

              {/* Custom fields */}
              {customFields.length > 0 && (
                <>
                  <div className="border-t border-white/10 pt-6">
                    <h3 className="text-lg font-medium mb-4">Additional Information</h3>
                  </div>

                  {customFields.map((field) => (
                    <div key={field.id}>
                      <label className="block text-sm font-medium mb-2">
                        {field.label} {field.required && '*'}
                      </label>
                      {renderField(field)}
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 rounded-lg border border-white/10 hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-neon text-black font-semibold rounded-lg hover:bg-neon/80 disabled:opacity-50 transition"
              >
                {submitting ? 'Registering...' : 'Complete Registration'}
              </button>
            </div>
              </>
            )}

            {registrationSource === 'GOOGLE_FORM' && (
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 px-6 py-3 rounded-lg border border-white/10 hover:bg-white/10 transition"
                >
                  Back
                </button>
                {externalFormUrl && (
                  <a
                    href={externalFormUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-lg bg-amber-300 px-6 py-3 text-center font-semibold text-black transition hover:bg-amber-200"
                  >
                    Continue to Form
                  </a>
                )}
              </div>
            )}
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
