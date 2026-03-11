'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/auth-context';
import type { CollegeOption } from '@/types';
import type { CustomField } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DEFAULT_REGISTRATION_FIELDS,
  toLocalDateInput,
  toLocalTimeInput,
  toLocalDateTimeInput,
  stripHtml,
} from './_utils';

function CreateEventForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editParam = searchParams.get('edit');
  const errorRef = useRef<HTMLDivElement | null>(null);
  const { user } = useAuth();
  const [posterImage, setPosterImage] = useState<string | null>(null);
  const [posterFileName, setPosterFileName] = useState('');
  const posterInputRef = useRef<HTMLInputElement | null>(null);
  const [isUnlimitedCapacity, setIsUnlimitedCapacity] = useState(true);
  const [isSingleDayEvent, setIsSingleDayEvent] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [colleges, setColleges] = useState<CollegeOption[]>([]);
  const [collegesLoading, setCollegesLoading] = useState(false);
  const [visibilityModalOpen, setVisibilityModalOpen] = useState(false);
  const [collegeSearch, setCollegeSearch] = useState('');
  const [selectedVisibilityCollegeIds, setSelectedVisibilityCollegeIds] = useState<string[]>([]);
  const [startDateInputType, setStartDateInputType] = useState<'text' | 'date'>('text');
  const [startTimeInputType, setStartTimeInputType] = useState<'text' | 'time'>('text');
  const [endDateInputType, setEndDateInputType] = useState<'text' | 'date'>('text');
  const [endTimeInputType, setEndTimeInputType] = useState<'text' | 'time'>('text');
  const [registrationDeadlineInputType, setRegistrationDeadlineInputType] = useState<'text' | 'datetime-local'>('text');
  const [activeSection, setActiveSection] = useState<'eventInfo' | 'registrationMode' | 'registrationForm'>('eventInfo');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editingEventCode, setEditingEventCode] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const sectionOrder: Array<'eventInfo' | 'registrationMode' | 'registrationForm'> = [
    'eventInfo',
    'registrationMode',
    'registrationForm',
  ];

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    registrationDeadline: '',
    locationInfo: '',
    location: '',
    region: 'Asia/Kolkata',
    capacity: 'Unlimited',
    visibility: 'College',
    isPaid: false,
    ticketPrice: '0',
    registrationType: 'SOLO',
    registrationSource: 'WEBSITE',
    externalFormUrl: '',
    teamRequired: false,
    teamSizeMode: 'VARIABLE',
    fixedTeamSize: '2',
    minTeamSize: '1',
    maxTeamSize: '5',
    tags: '',
  });

  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [newField, setNewField] = useState<{
    label: string;
    type: 'text' | 'email' | 'phone' | 'number' | 'dropdown' | 'checkbox' | 'date' | 'textarea';
    required: boolean;
    placeholder: string;
    options: string;
  }>({
    label: '',
    type: 'text',
    required: false,
    placeholder: '',
    options: '',
  });

  useEffect(() => {
    const loadColleges = async () => {
      setCollegesLoading(true);
      try {
        const response = await fetch('/api/colleges');
        if (!response.ok) {
          return;
        }

        const data = await response.json();
        const list = data?.data || [];
        setColleges(Array.isArray(list) ? list : []);
      } catch (fetchError) {
        console.error('Failed to fetch colleges for visibility options:', fetchError);
      } finally {
        setCollegesLoading(false);
      }
    };

    loadColleges();
  }, []);

  useEffect(() => {
    if (!editParam) {
      return;
    }

    const loadEventForEdit = async () => {
      setEditLoading(true);
      try {
        const isCode = /^[0-9a-z]{8}$/.test(editParam);
        const endpoint = isCode ? `/api/events/code/${editParam}` : `/api/events/${editParam}`;
        const response = await fetch(endpoint, { cache: 'no-store' });

        if (!response.ok) {
          setError('Failed to load event data for editing.');
          return;
        }

        const data = await response.json();
        const eventData = data?.data || data?.event;
        if (!eventData) {
          setError('Event not found for editing.');
          return;
        }

        setIsEditMode(true);
        setEditingEventId(eventData.id || null);
        setEditingEventCode(eventData.eventCode || null);

        let parsedMeta: any = {};
        try {
          parsedMeta = eventData.customRegistrationFields
            ? JSON.parse(eventData.customRegistrationFields)
            : {};
        } catch {
          parsedMeta = {};
        }

        const startDate = toLocalDateInput(eventData.date);
        const startTime = toLocalTimeInput(eventData.date);
        const schedule = parsedMeta?.schedule || {};
        const deadlineValue = parsedMeta?.registrationDeadline || new Date(new Date(eventData.date).getTime() - 60 * 60 * 1000);
        const visibility = parsedMeta?.visibility || {};
        const mapLocation = parsedMeta?.location?.mapLink || '';
        const locationInfo = parsedMeta?.location?.info || stripHtml(eventData.venue || '');

        const incomingFields = Array.isArray(parsedMeta?.fields) ? parsedMeta.fields : [];
        const userDefinedFields = incomingFields.filter(
          (field: CustomField) => !DEFAULT_REGISTRATION_FIELDS.some((defaultField) => defaultField.id === field.id)
        );

        const fixedTeamSize = Number(eventData.minTeamSize || 2);
        const isUnlimited = Number(eventData.capacity) === 9999;

        setPosterImage(eventData.bannerUrl || null);
        setPosterFileName(eventData.bannerUrl ? 'Current poster' : '');
        setIsUnlimitedCapacity(isUnlimited);
        setIsSingleDayEvent(schedule?.isSingleDayEvent !== false);
        setSelectedVisibilityCollegeIds(Array.isArray(visibility?.collegeIds) ? visibility.collegeIds : []);
        setCustomFields(Array.isArray(userDefinedFields) ? userDefinedFields : []);

        setFormData((prev) => ({
          ...prev,
          title: eventData.title || '',
          description: eventData.description || '',
          startDate,
          startTime,
          endDate: schedule?.endDate || '',
          endTime: schedule?.endTime || '',
          registrationDeadline: toLocalDateTimeInput(deadlineValue),
          locationInfo,
          location: mapLocation,
          capacity: isUnlimited ? 'Unlimited' : String(eventData.capacity || 100),
          visibility: visibility?.mode || 'College',
          isPaid: Boolean(eventData.isPaid),
          ticketPrice: String(eventData.ticketPrice || 0),
          registrationType: eventData.registrationType || 'SOLO',
          registrationSource: parsedMeta?.registrationSource || 'WEBSITE',
          externalFormUrl: parsedMeta?.externalFormUrl || '',
          teamRequired: Boolean(eventData.teamRequired),
          teamSizeMode: parsedMeta?.teamConfig?.mode || (Number(eventData.minTeamSize) === Number(eventData.maxTeamSize) ? 'FIXED' : 'VARIABLE'),
          fixedTeamSize: String(fixedTeamSize),
          minTeamSize: String(eventData.minTeamSize || 1),
          maxTeamSize: String(eventData.maxTeamSize || 5),
          tags: eventData.tags || '',
        }));
      } catch (err) {
        console.error('Failed to prefill event for editing:', err);
        setError('Failed to load edit data. Please try again.');
      } finally {
        setEditLoading(false);
      }
    };

    loadEventForEdit();
  }, [editParam]);

  useEffect(() => {
    if (error) {
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [error]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const applyPosterFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      return;
    }

    // Keep poster uploads lightweight for faster previews and requests.
    if (file.size > 5 * 1024 * 1024) {
      setError('Poster image must be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPosterImage(event.target?.result as string);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      applyPosterFile(file);
      setPosterFileName(file.name);
      // Allow re-selecting the same file if needed.
      e.currentTarget.value = '';
    }
  };

  const addCustomField = () => {
    if (!newField.label.trim()) {
      setError('Field label is required');
      return;
    }

    const field: CustomField = {
      id: Date.now().toString(),
      label: newField.label,
      type: newField.type,
      required: newField.required,
      placeholder: newField.placeholder,
      options: newField.type === 'dropdown' ? newField.options.split(',').map(o => o.trim()) : undefined,
    };

    setCustomFields([...customFields, field]);
    setNewField({ label: '', type: 'text', required: false, placeholder: '', options: '' });
    setError('');
  };

  const removeCustomField = (id: string) => {
    setCustomFields(customFields.filter(f => f.id !== id));
  };

  const validateEventInfoStep = () => {
    if (!formData.title.trim()) {
      setError('Event title is required.');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Event description is required.');
      return false;
    }
    if (!formData.startDate || !formData.startTime) {
      setError('Event date and time are required.');
      return false;
    }
    if (!formData.registrationDeadline) {
      setError('Registration deadline is required.');
      return false;
    }
    const registrationDeadline = new Date(formData.registrationDeadline);
    const eventStart = new Date(`${formData.startDate}T${formData.startTime}`);
    if (!(registrationDeadline < eventStart)) {
      setError('Registration deadline must be before the event start date and time.');
      return false;
    }
    if (!formData.locationInfo.trim()) {
      setError('Location info is required.');
      return false;
    }
    if (!posterImage) {
      setError('Please upload an event poster image.');
      return false;
    }
    if (formData.visibility === 'Custom' && selectedVisibilityCollegeIds.length === 0) {
      setError('Please enable at least one college for custom visibility.');
      return false;
    }
    if (!isUnlimitedCapacity) {
      const parsedCapacity = parseInt(formData.capacity, 10);
      if (Number.isNaN(parsedCapacity) || parsedCapacity <= 0) {
        setError('Capacity must be a positive number.');
        return false;
      }
    }
    setError('');
    return true;
  };

  const validateRegistrationModeStep = () => {
    if (formData.registrationSource === 'GOOGLE_FORM' && !formData.externalFormUrl.trim()) {
      setError('Please add the Google Form link for external registration.');
      return false;
    }

    if (formData.registrationType === 'TEAM') {
      if (formData.teamSizeMode === 'FIXED') {
        const fixedSize = parseInt(formData.fixedTeamSize, 10);
        if (Number.isNaN(fixedSize) || fixedSize < 2) {
          setError('Fixed team size must be at least 2 participants.');
          return false;
        }
      } else {
        const minTeam = parseInt(formData.minTeamSize, 10);
        const maxTeam = parseInt(formData.maxTeamSize, 10);
        if (Number.isNaN(minTeam) || Number.isNaN(maxTeam) || minTeam < 2 || maxTeam < 2) {
          setError('Team size range must be at least 2 participants.');
          return false;
        }
        if (minTeam > maxTeam) {
          setError('Min team size cannot be greater than max team size.');
          return false;
        }
      }
    }

    setError('');
    return true;
  };

  const handleNextStep = () => {
    const currentIndex = sectionOrder.indexOf(activeSection);
    if (currentIndex === 0 && !validateEventInfoStep()) {
      return;
    }
    if (currentIndex === 1 && !validateRegistrationModeStep()) {
      return;
    }
    if (currentIndex < sectionOrder.length - 1) {
      setActiveSection(sectionOrder[currentIndex + 1]);
    }
  };

  const handlePreviousStep = () => {
    const currentIndex = sectionOrder.indexOf(activeSection);
    if (currentIndex > 0) {
      setActiveSection(sectionOrder[currentIndex - 1]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!posterImage) {
      setError('Please upload an event poster image.');
      return;
    }

    if (formData.visibility === 'Custom' && selectedVisibilityCollegeIds.length === 0) {
      setError('Please enable at least one college for custom visibility.');
      return;
    }

    if (!isUnlimitedCapacity) {
      const parsedCapacity = parseInt(formData.capacity, 10);
      if (Number.isNaN(parsedCapacity) || parsedCapacity <= 0) {
        setError('Capacity must be a positive number.');
        return;
      }
    }

    if (formData.registrationSource === 'GOOGLE_FORM' && !formData.externalFormUrl.trim()) {
      setError('Please add the Google Form link for external registration.');
      return;
    }

    if (!isSingleDayEvent) {
      if (!formData.endDate || !formData.endTime) {
        setError('Please provide end date and end time for multi-day events.');
        return;
      }

      const start = new Date(`${formData.startDate}T${formData.startTime}`);
      const end = new Date(`${formData.endDate}T${formData.endTime}`);
      if (!(end > start)) {
        setError('End date and time must be after the start date and time.');
        return;
      }
    }

    const registrationDeadline = new Date(formData.registrationDeadline);
    const eventStart = new Date(`${formData.startDate}T${formData.startTime}`);
    if (!(registrationDeadline < eventStart)) {
      setError('Registration deadline must be before the event start date and time.');
      return;
    }

    setLoading(true);

    try {
      const eventStartDate = new Date(`${formData.startDate}T${formData.startTime}`);
      const resolvedMinTeamSize =
        formData.registrationType === 'TEAM'
          ? formData.teamSizeMode === 'FIXED'
            ? parseInt(formData.fixedTeamSize, 10)
            : parseInt(formData.minTeamSize, 10)
          : 1;
      const resolvedMaxTeamSize =
        formData.registrationType === 'TEAM'
          ? formData.teamSizeMode === 'FIXED'
            ? parseInt(formData.fixedTeamSize, 10)
            : parseInt(formData.maxTeamSize, 10)
          : 1;

      const requestPayload = {
        title: formData.title,
        description: formData.description,
        tags: formData.tags,
        date: eventStartDate.toISOString(),
        venue: formData.locationInfo,
        capacity: isUnlimitedCapacity ? 9999 : parseInt(formData.capacity, 10),
        bannerUrl: posterImage,
        isPaid: formData.isPaid,
        ticketPrice: formData.isPaid ? parseFloat(formData.ticketPrice) : 0,
        registrationType: formData.registrationType,
        teamRequired: formData.registrationType === 'TEAM' ? formData.teamRequired : false,
        minTeamSize: resolvedMinTeamSize,
        maxTeamSize: resolvedMaxTeamSize,
        customRegistrationFields: JSON.stringify({
          version: 2,
          registrationDeadline: new Date(formData.registrationDeadline).toISOString(),
          visibility: {
            mode: formData.visibility,
            collegeIds:
              formData.visibility === 'Public'
                ? []
                : formData.visibility === 'College'
                ? user?.collegeId
                  ? [user.collegeId]
                  : []
                : selectedVisibilityCollegeIds,
            collegeNames: colleges
              .filter((college) =>
                (formData.visibility === 'College' && user?.collegeId
                  ? [user.collegeId]
                  : selectedVisibilityCollegeIds
                ).includes(college.id)
              )
              .map((college) => college.name),
          },
          registrationSource: formData.registrationSource,
          externalFormUrl:
            formData.registrationSource === 'GOOGLE_FORM' ? formData.externalFormUrl.trim() : null,
          schedule: {
            isSingleDayEvent,
            endDate: isSingleDayEvent ? null : formData.endDate,
            endTime: isSingleDayEvent ? null : formData.endTime,
          },
          fields: [...DEFAULT_REGISTRATION_FIELDS, ...customFields],
          location: {
            info: formData.locationInfo,
            mapLink: formData.location.trim() || null,
          },
          teamConfig:
            formData.registrationType === 'TEAM'
              ? {
                  mode: formData.teamSizeMode,
                  fixedSize:
                    formData.teamSizeMode === 'FIXED'
                      ? parseInt(formData.fixedTeamSize, 10)
                      : null,
                }
              : null,
        }),
        collegeId:
          formData.visibility === 'Public'
            ? null
            : formData.visibility === 'College'
            ? user?.collegeId || null
            : selectedVisibilityCollegeIds[0] || null,
      };

      const endpoint = isEditMode && editingEventId ? `/api/events/${editingEventId}` : '/api/events';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });

      if (response.ok) {
        const data = await response.json();
        const updatedOrCreated = data?.data?.event || data?.data || data?.event;
        const eventCode = updatedOrCreated?.eventCode || editingEventCode;
        
        if (!eventCode) {
          setError('Event was saved but the response did not include an event code.');
          return;
        }
        router.push(`/events/${eventCode}`);
      } else {
        const data = await response.json();
        if (Array.isArray(data?.errors) && data.errors.length > 0) {
          setError(data.errors[0]?.message || data.message || 'Validation error');
        } else {
          setError(data.message || data.error || (isEditMode ? 'Failed to update event' : 'Failed to create event'));
        }
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (editLoading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon mx-auto mb-4"></div>
          <div className="text-white text-lg mb-2">
            {editLoading ? 'Loading event for editing...' : 'Loading event creation form...'}
          </div>
          <div className="text-muted text-sm">{editLoading ? 'Fetching event data' : 'Verifying authentication'}</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const visibleColleges = colleges.filter((college) =>
    college.name.toLowerCase().includes(collegeSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-ink text-white flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 w-full px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 grid grid-cols-1 gap-2 rounded-2xl border border-white/10 bg-black/40 p-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setActiveSection('eventInfo')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                activeSection === 'eventInfo'
                  ? 'bg-black/70 text-neon border border-neon/40'
                  : 'text-muted hover:text-white border border-transparent hover:bg-white/[0.04]'
              }`}
            >
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                activeSection === 'eventInfo' ? 'bg-neon text-black' : 'bg-white/10 text-white'
              }`}>1</span>
              Event info
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('registrationMode')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                activeSection === 'registrationMode'
                  ? 'bg-black/70 text-neon border border-neon/40'
                  : 'text-muted hover:text-white border border-transparent hover:bg-white/[0.04]'
              }`}
            >
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                activeSection === 'registrationMode' ? 'bg-neon text-black' : 'bg-white/10 text-white'
              }`}>2</span>
              Registration mode
            </button>
            <button
              type="button"
              onClick={() => formData.registrationSource === 'WEBSITE' && setActiveSection('registrationForm')}
              disabled={formData.registrationSource !== 'WEBSITE'}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                activeSection === 'registrationForm'
                  ? 'bg-black/70 text-neon border border-neon/40'
                  : formData.registrationSource !== 'WEBSITE'
                  ? 'text-soft opacity-40 cursor-not-allowed border border-transparent'
                  : 'text-muted hover:text-white border border-transparent hover:bg-white/[0.04]'
              }`}
              title={formData.registrationSource !== 'WEBSITE' ? 'Only configurable on website registration mode' : ''}
            >
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                activeSection === 'registrationForm' ? 'bg-neon text-black' : formData.registrationSource !== 'WEBSITE' ? 'bg-white/5 text-soft' : 'bg-white/10 text-white'
              }`}>3</span>
              <div className="flex flex-col items-start">
                <span>Registration form</span>
                {formData.registrationSource !== 'WEBSITE' && (
                  <span className="text-[10px] text-soft">Only on website mode</span>
                )}
              </div>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div ref={errorRef} className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                {error}
              </div>
            )}

            {activeSection === 'eventInfo' && (
            <section className="space-y-4 rounded-2xl border border-white/10 bg-black/35 p-5">
              <h2 className="text-xs font-medium uppercase tracking-wider text-soft">Event info</h2>

              <div className="grid gap-6 lg:grid-cols-12">
                <aside className="space-y-3 lg:col-span-4">
                  <section className="rounded-xl border border-white/10 bg-black/25 p-4">
                    <h3 className="text-xs font-medium uppercase tracking-wider text-soft">Poster</h3>

                    <div className="mt-3 h-64 overflow-hidden rounded-xl border border-white/20 bg-gradient-to-br from-black/70 via-black/50 to-black/30 flex items-center justify-center">
                      {posterImage ? (
                        <img src={posterImage} alt="Event poster" className="h-full w-full object-cover" />
                      ) : (
                        <div className="p-3 text-center">
                          <svg className="mx-auto mb-1.5 h-8 w-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm text-muted">Upload event poster</p>
                          <p className="text-xs text-soft">PNG or JPG recommended</p>
                        </div>
                      )}
                    </div>

                    <input
                      ref={posterInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />

                    <button
                      type="button"
                      onClick={() => posterInputRef.current?.click()}
                      className="mt-3 block w-full cursor-pointer rounded-lg bg-neon px-3.5 py-2.5 text-center text-sm font-semibold text-black transition hover:bg-neon/80"
                    >
                      Upload Image
                    </button>

                    {posterFileName && (
                      <p className="mt-2 truncate text-xs text-muted" title={posterFileName}>
                        Selected: {posterFileName}
                      </p>
                    )}

                    <label className="sr-only">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>

                    {posterImage && (
                      <button
                        type="button"
                        onClick={() => {
                          setPosterImage(null);
                          setPosterFileName('');
                        }}
                        className="mt-2 w-full rounded-lg border border-white/10 px-3.5 py-2 text-sm transition hover:bg-white/5"
                      >
                        Remove Image
                      </button>
                    )}
                  </section>

                  <section className="rounded-xl border border-white/10 bg-black/25 p-4">
                    <h3 className="text-xs font-medium uppercase tracking-wider text-soft">Venue / Location</h3>
                    <div className="mt-3">
                      <label className="mb-2 block text-sm font-medium">Location Info *</label>
                      <input
                        type="text"
                        name="locationInfo"
                        value={formData.locationInfo}
                        onChange={handleChange}
                        placeholder="San Jose, California / Auditorium name / Building floor"
                        className="w-full rounded-lg border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm transition focus:border-neon focus:outline-none"
                        required
                      />
                    </div>

                    <div className="mt-3">
                      <label className="mb-2 block text-sm font-medium">Map Location Link</label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="Venue, meeting link, or embedded map URL"
                        className="w-full rounded-lg border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm transition focus:border-neon focus:outline-none"
                        required
                      />
                      <p className="mt-1.5 text-xs text-soft">For maps: Share → Embed a map → Copy HTML (use the src URL)</p>
                    </div>
                    
                    <div className="mt-3">
                      <div className="aspect-square w-full overflow-hidden rounded-lg border border-white/20 bg-black/40">
                        {formData.location &&
                        (formData.location.includes('google.com/maps/embed') ||
                          formData.location.includes('maps.google.com/maps')) ? (
                          <iframe
                            src={formData.location.includes('src="') ? formData.location.split('src="')[1]?.split('"')[0] : formData.location}
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Map preview"
                          ></iframe>
                        ) : (
                          <div className="relative h-full w-full">
                            <iframe
                              src="https://www.openstreetmap.org/export/embed.html?bbox=77.55%2C12.90%2C77.70%2C13.05&layer=mapnik"
                              width="100%"
                              height="100%"
                              style={{ border: 0 }}
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                              title="Default map placeholder"
                              className="pointer-events-none"
                            ></iframe>
                            <div className="absolute inset-0 bg-black/45 backdrop-blur-[3px]" aria-hidden="true" />
                            <div className="relative z-10 -mt-full flex h-full items-center justify-center p-4 text-center">
                              <div>
                                <p className="text-xs font-medium text-white/90">Add your location</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                </aside>

                <div className="space-y-4 lg:col-span-8">
                  <section className="space-y-3 rounded-xl border border-white/10 bg-black/25 p-4">
                    <h3 className="text-xs font-medium uppercase tracking-wider text-soft">Core details</h3>
                    <div>
                      <label className="mb-2 block text-sm font-medium">Event Title *</label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Enter event title"
                        className="w-full rounded-lg border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm transition focus:border-neon focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Describe your event"
                        className="w-full rounded-lg border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm transition focus:border-neon focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">Tags (comma-separated)</label>
                      <input
                        type="text"
                        name="tags"
                        value={formData.tags}
                        onChange={handleChange}
                        placeholder="e.g., Technology, Workshop, Free, Students"
                        className="w-full rounded-lg border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm transition focus:border-neon focus:outline-none"
                      />
                      <p className="mt-1.5 text-xs text-soft">Add relevant tags to help students find your event</p>
                    </div>
                  </section>

                  <section className="space-y-3 rounded-xl border border-white/10 bg-black/25 p-4">
                    <h3 className="text-xs font-medium uppercase tracking-wider text-soft">Schedule and venue</h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div>
                        <label className="mb-2 block text-sm font-medium">Event date *</label>
                        <input
                          type={formData.startDate ? 'date' : startDateInputType}
                          name="startDate"
                          value={formData.startDate}
                          onChange={handleChange}
                          placeholder="dd-mm-yyyy"
                          onFocus={() => setStartDateInputType('date')}
                          onBlur={(e) => {
                            if (!e.target.value) {
                              setStartDateInputType('text');
                            }
                          }}
                          className="w-full rounded-lg border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm placeholder:text-soft transition focus:border-neon focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium">Event time *</label>
                        <input
                          type={formData.startTime ? 'time' : startTimeInputType}
                          name="startTime"
                          value={formData.startTime}
                          onChange={handleChange}
                          placeholder="hh:mm AM/PM"
                          onFocus={() => setStartTimeInputType('time')}
                          onBlur={(e) => {
                            if (!e.target.value) {
                              setStartTimeInputType('text');
                            }
                          }}
                          className="w-full rounded-lg border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm placeholder:text-soft transition focus:border-neon focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-white">Region *</label>
                        <Select
                          value={formData.region}
                          onValueChange={(value) => setFormData({ ...formData, region: value })}
                          required
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select region" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                            <SelectItem value="America/New_York">USA - East (EST)</SelectItem>
                            <SelectItem value="America/Los_Angeles">USA - West (PST)</SelectItem>
                            <SelectItem value="Europe/London">UK (GMT)</SelectItem>
                            <SelectItem value="Europe/Paris">Europe (CET)</SelectItem>
                            <SelectItem value="Asia/Dubai">UAE (GST)</SelectItem>
                            <SelectItem value="Asia/Singapore">Singapore (SGT)</SelectItem>
                            <SelectItem value="Australia/Sydney">Australia (AEST)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                      <label className="mb-2 block text-sm font-medium">Event duration mode</label>
                      <div className="inline-flex rounded-lg border border-white/10 bg-black/30 p-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsSingleDayEvent(true);
                            setFormData((current) => ({
                              ...current,
                              endDate: '',
                              endTime: '',
                            }));
                          }}
                          className={`rounded-md px-3 py-1.5 text-sm transition ${
                            isSingleDayEvent
                              ? 'bg-neon text-black font-semibold'
                              : 'text-muted hover:text-white'
                          }`}
                        >
                          Single day
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsSingleDayEvent(false)}
                          className={`rounded-md px-3 py-1.5 text-sm transition ${
                            !isSingleDayEvent
                              ? 'bg-neon text-black font-semibold'
                              : 'text-muted hover:text-white'
                          }`}
                        >
                          Multi day
                        </button>
                      </div>
                    </div>

                    {!isSingleDayEvent && (
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium">End date *</label>
                          <input
                            type={formData.endDate ? 'date' : endDateInputType}
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleChange}
                            placeholder="dd-mm-yyyy"
                            onFocus={() => setEndDateInputType('date')}
                            onBlur={(e) => {
                              if (!e.target.value) {
                                setEndDateInputType('text');
                              }
                            }}
                            className="w-full rounded-lg border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm placeholder:text-soft transition focus:border-neon focus:outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium">End time *</label>
                          <input
                            type={formData.endTime ? 'time' : endTimeInputType}
                            name="endTime"
                            value={formData.endTime}
                            onChange={handleChange}
                            placeholder="hh:mm AM/PM"
                            onFocus={() => setEndTimeInputType('time')}
                            onBlur={(e) => {
                              if (!e.target.value) {
                                setEndTimeInputType('text');
                              }
                            }}
                            className="w-full rounded-lg border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm placeholder:text-soft transition focus:border-neon focus:outline-none"
                            required
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="mb-2 block text-sm font-medium">Registration deadline *</label>
                      <input
                        type={
                          formData.registrationDeadline ? 'datetime-local' : registrationDeadlineInputType
                        }
                        name="registrationDeadline"
                        value={formData.registrationDeadline}
                        onChange={handleChange}
                        placeholder="dd-mm-yyyy hh:mm AM/PM"
                        onFocus={() => setRegistrationDeadlineInputType('datetime-local')}
                        onBlur={(e) => {
                          if (!e.target.value) {
                            setRegistrationDeadlineInputType('text');
                          }
                        }}
                        className="w-full rounded-lg border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm transition focus:border-neon focus:outline-none"
                        required
                      />
                    </div>
                  </section>

                  <section className="space-y-3 rounded-xl border border-white/10 bg-black/25 p-4">
                    <h3 className="text-xs font-medium uppercase tracking-wider text-soft">Access and capacity</h3>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white">Visibility</span>
                      <Select
                        value={formData.visibility}
                        onValueChange={(value) => {
                          setFormData({ ...formData, visibility: value });
                          if (value === 'Custom') {
                            setVisibilityModalOpen(true);
                          }
                        }}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Public">Public</SelectItem>
                          <SelectItem value="College">College</SelectItem>
                          <SelectItem value="Custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.visibility === 'Custom' && (
                      <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-xs uppercase tracking-wider text-soft">Selected Colleges</p>
                            <p className="mt-1 text-sm text-white">
                              {selectedVisibilityCollegeIds.length > 0
                                ? `${selectedVisibilityCollegeIds.length} college(s) enabled`
                                : 'No colleges enabled'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setVisibilityModalOpen(true)}
                            className="rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
                          >
                            Manage Colleges
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, isPaid: false })}
                        className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition ${
                          !formData.isPaid
                            ? 'bg-black/40 border-white/20'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        Free
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, isPaid: true })}
                        className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition ${
                          formData.isPaid
                            ? 'bg-neon text-black border-neon'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        Paid
                      </button>
                    </div>

                    {formData.isPaid && (
                      <input
                        type="number"
                        name="ticketPrice"
                        value={formData.ticketPrice}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        placeholder="Ticket price"
                        className="w-full rounded-lg border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm transition focus:border-neon focus:outline-none"
                      />
                    )}

                    <div className="space-y-3 rounded-lg border border-white/10 bg-black/20 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Unlimited capacity</span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsUnlimitedCapacity((prev) => !prev);
                            setFormData((prev) => ({
                              ...prev,
                              capacity: prev.capacity === 'Unlimited' ? '100' : 'Unlimited',
                            }));
                          }}
                          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                            isUnlimitedCapacity ? 'bg-neon' : 'bg-white/10'
                          }`}
                        >
                          <span
                            className={`inline-block h-6 w-6 transform rounded-full bg-black transition-transform ${
                              isUnlimitedCapacity ? 'translate-x-7' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      {!isUnlimitedCapacity && (
                        <div>
                          <label className="mb-2 block text-sm font-medium">Capacity *</label>
                          <input
                            type="number"
                            name="capacity"
                            value={formData.capacity}
                            onChange={handleChange}
                            min="1"
                            className="w-full rounded-lg border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm transition focus:border-neon focus:outline-none"
                            required
                          />
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </div>
            </section>
            )}

            {activeSection === 'registrationMode' && (
            <section className="space-y-3 rounded-2xl border border-white/10 bg-black/35 p-5">
              <h2 className="text-xs font-medium uppercase tracking-wider text-soft">Registration mode</h2>

              <div className="space-y-2">
                <p className="text-sm font-medium">How should users register?</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className={`cursor-pointer rounded-lg border p-3 transition ${
                        formData.registrationSource === 'WEBSITE'
                          ? 'border-neon/50 bg-neon/10'
                          : 'border-white/10 bg-black/20 hover:border-white/20'
                      }`}>
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="registrationSource"
                            value="WEBSITE"
                            checked={formData.registrationSource === 'WEBSITE'}
                            onChange={handleChange}
                            className="h-4 w-4"
                          />
                          <div>
                            <p className="font-medium">Register on website</p>
                            <p className="text-xs text-muted">Use Eventura registration form</p>
                          </div>
                        </div>
                      </label>
                      <label className={`cursor-pointer rounded-lg border p-3 transition ${
                        formData.registrationSource === 'GOOGLE_FORM'
                          ? 'border-neon/50 bg-neon/10'
                          : 'border-white/10 bg-black/20 hover:border-white/20'
                      }`}>
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="registrationSource"
                            value="GOOGLE_FORM"
                            checked={formData.registrationSource === 'GOOGLE_FORM'}
                            onChange={handleChange}
                            className="h-4 w-4"
                          />
                          <div>
                            <p className="font-medium">Register using Google Form</p>
                            <p className="text-xs text-muted">Use external Google Form link</p>
                          </div>
                        </div>
                      </label>
                </div>
              </div>

              {formData.registrationSource === 'GOOGLE_FORM' && (
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <label className="mb-2 block text-sm font-medium">Google Form Link *</label>
                  <input
                    type="url"
                    name="externalFormUrl"
                    value={formData.externalFormUrl}
                    onChange={handleChange}
                    placeholder="https://forms.gle/..."
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm transition focus:border-neon focus:outline-none"
                    required
                  />
                  <p className="mt-2 text-xs text-muted">Participants will be redirected to this link.</p>
                </div>
              )}

              <div className="pt-1">
                <p className="text-sm font-medium">Participant type</p>
                {formData.registrationSource === 'GOOGLE_FORM' && (
                  <p className="mt-1 text-xs text-soft">Disabled for Google Form mode</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className={`cursor-pointer rounded-lg border p-3 transition ${
                      formData.registrationType === 'SOLO' 
                        ? 'border-neon bg-neon/10' 
                        : 'border-white/10 bg-black/20 hover:border-white/20'
                    } ${formData.registrationSource === 'GOOGLE_FORM' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="registrationType"
                          value="SOLO"
                          checked={formData.registrationType === 'SOLO'}
                          onChange={handleChange}
                          disabled={formData.registrationSource === 'GOOGLE_FORM'}
                          className="h-4 w-4"
                        />
                        <div>
                          <p className="font-medium">Individual (Solo)</p>
                          <p className="text-xs text-muted">One person per registration</p>
                        </div>
                      </div>
                    </label>
                    <label className={`cursor-pointer rounded-lg border p-3 transition ${
                      formData.registrationType === 'TEAM' 
                        ? 'border-neon bg-neon/10' 
                        : 'border-white/10 bg-black/20 hover:border-white/20'
                    } ${formData.registrationSource === 'GOOGLE_FORM' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="registrationType"
                          value="TEAM"
                          checked={formData.registrationType === 'TEAM'}
                          onChange={handleChange}
                          disabled={formData.registrationSource === 'GOOGLE_FORM'}
                          className="h-4 w-4"
                        />
                        <div>
                          <p className="font-medium">Team Registration</p>
                          <p className="text-xs text-muted">Multiple people per team</p>
                        </div>
                      </div>
                    </label>
              </div>

              {formData.registrationType === 'TEAM' && (
                <section className="space-y-3 rounded-xl border border-white/10 bg-black/25 p-4">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-soft">Team configuration</h3>
                    
                    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-3">
                      <div>
                        <p className="text-sm font-medium">Team is Required</p>
                        <p className="text-xs text-muted">Force users to register as a team</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, teamRequired: !formData.teamRequired })}
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                          formData.teamRequired ? 'bg-neon' : 'bg-white/10'
                        }`}
                      >
                        <span
                          className={`inline-block h-6 w-6 transform rounded-full bg-black transition-transform ${
                            formData.teamRequired ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="mb-2 block text-sm font-medium text-white">Team size mode</label>
                        <Select
                          value={formData.teamSizeMode}
                          onValueChange={(value) => {
                            if (value === 'FIXED') {
                              const fixed = formData.fixedTeamSize || '2';
                              setFormData({
                                ...formData,
                                teamSizeMode: value,
                                minTeamSize: fixed,
                                maxTeamSize: fixed,
                              });
                              return;
                            }
                            setFormData({ ...formData, teamSizeMode: value });
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="VARIABLE">Variable team size</SelectItem>
                            <SelectItem value="FIXED">Fixed team size</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {formData.teamSizeMode === 'FIXED' ? (
                        <div className="col-span-2">
                          <label className="mb-2 block text-sm font-medium">Team Size</label>
                          <input
                            type="number"
                            name="fixedTeamSize"
                            value={formData.fixedTeamSize}
                            onChange={(e) => {
                              const fixed = e.target.value;
                              setFormData({
                                ...formData,
                                fixedTeamSize: fixed,
                                minTeamSize: fixed,
                                maxTeamSize: fixed,
                              });
                            }}
                            min="2"
                            max="20"
                            className="w-full rounded-lg border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm transition focus:border-neon focus:outline-none"
                          />
                        </div>
                      ) : (
                        <>
                      <div>
                        <label className="mb-2 block text-sm font-medium">Min Team Size</label>
                        <input
                          type="number"
                          name="minTeamSize"
                          value={formData.minTeamSize}
                          onChange={handleChange}
                          min="1"
                          max="20"
                          className="w-full rounded-lg border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm transition focus:border-neon focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium">Max Team Size</label>
                        <input
                          type="number"
                          name="maxTeamSize"
                          value={formData.maxTeamSize}
                          onChange={handleChange}
                          min="1"
                          max="20"
                          className="w-full rounded-lg border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm transition focus:border-neon focus:outline-none"
                        />
                      </div>
                        </>
                      )}
                    </div>
                </section>
              )}
            </section>
            )}

            {activeSection === 'registrationForm' && (
            <section className="space-y-3 rounded-2xl border border-white/10 bg-black/35 p-5">
              <div className="mb-1 flex items-center justify-between">
                <h2 className="text-xs font-medium uppercase tracking-wider text-soft">Registration form</h2>
                <span className="text-xs text-muted">Default fields included automatically</span>
              </div>

              {formData.registrationSource !== 'WEBSITE' && (
                <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-200/90">
                  <div className="flex items-start gap-3">
                    <svg className="h-5 w-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="font-semibold">Registration form not available</p>
                      <p className="mt-1 text-xs">This section is only configurable when using website registration mode. Switch to website mode in step 2 to customize the registration form.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 p-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neon/20 text-neon">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Full Name</p>
                        <p className="text-xs text-muted">Text • Required</p>
                      </div>
                      <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-white">Default</span>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 p-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neon/20 text-neon">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Email Address</p>
                        <p className="text-xs text-muted">Email • Required</p>
                      </div>
                      <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-white">Default</span>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 p-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neon/20 text-neon">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Whatsapp Number</p>
                        <p className="text-xs text-muted">Phone • Required</p>
                      </div>
                      <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-white">Default</span>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 p-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neon/20 text-neon">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">College</p>
                        <p className="text-xs text-muted">Text • Required</p>
                      </div>
                      <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-white">Default</span>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 p-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neon/20 text-neon">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">College Registration No</p>
                        <p className="text-xs text-muted">Text • Required</p>
                      </div>
                      <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-white">Default</span>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 p-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neon/20 text-neon">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Year</p>
                        <p className="text-xs text-muted">Dropdown • Required</p>
                      </div>
                      <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-white">Default</span>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 p-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neon/20 text-neon">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Branch</p>
                        <p className="text-xs text-muted">Text • Required</p>
                      </div>
                      <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-white">Default</span>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 p-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neon/20 text-neon">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Section</p>
                        <p className="text-xs text-muted">Text • Required</p>
                      </div>
                      <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-white">Default</span>
                    </div>
              </div>

              <section className="space-y-3 rounded-xl border border-white/10 bg-black/25 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-soft">Custom fields</h3>
                  <span className="text-xs text-muted">{customFields.length} added</span>
                </div>

                {customFields.length > 0 && (
                  <div className="space-y-2">
                    {customFields.map((field) => (
                      <div
                        key={field.id}
                        className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 p-3"
                      >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{field.label}</p>
                            <p className="text-xs text-muted">
                              {field.type} • {field.required ? 'Required' : 'Optional'}
                            </p>
                          </div>
                        <button
                          type="button"
                          onClick={() => removeCustomField(field.id)}
                          className="rounded border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs text-red-400 transition hover:bg-red-500/20"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const addFieldSection = document.getElementById('add-field-section');
                    if (addFieldSection) {
                      addFieldSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                  }}
                  disabled={formData.registrationSource !== 'WEBSITE'}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 bg-white/5 px-3.5 py-3 text-sm font-medium transition enabled:hover:border-neon/50 enabled:hover:bg-neon/5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add New Field
                </button>

                <section id="add-field-section" className="space-y-3 rounded-xl border border-white/10 bg-black/25 p-4">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-soft">Add new field</h3>

                  {formData.registrationSource !== 'WEBSITE' && (
                    <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-muted">
                      Switch to Website registration mode to add or edit custom fields.
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="mb-2 block text-sm font-medium">Field Label *</label>
                      <input
                        type="text"
                        value={newField.label}
                        onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                        placeholder="e.g., 'Skill Level', 'College Roll No.'"
                        disabled={formData.registrationSource !== 'WEBSITE'}
                        className="w-full rounded-lg border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm transition focus:border-neon focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-white">Field Type *</label>
                        <Select
                          value={newField.type}
                          onValueChange={(value) => setNewField({ ...newField, type: value as any })}
                          disabled={formData.registrationSource !== 'WEBSITE'}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="phone">Phone Number</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="dropdown">Dropdown</SelectItem>
                            <SelectItem value="checkbox">Checkbox</SelectItem>
                            <SelectItem value="textarea">Textarea</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium">Placeholder</label>
                        <input
                          type="text"
                          value={newField.placeholder}
                          onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                          placeholder="Optional hint text"
                          disabled={formData.registrationSource !== 'WEBSITE'}
                          className="w-full rounded-lg border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm transition focus:border-neon focus:outline-none"
                        />
                      </div>
                    </div>

                    {newField.type === 'dropdown' && (
                      <div>
                        <label className="mb-2 block text-sm font-medium">Options (comma-separated)</label>
                        <input
                          type="text"
                          value={newField.options}
                          onChange={(e) => setNewField({ ...newField, options: e.target.value })}
                          placeholder="Option 1, Option 2, Option 3"
                          disabled={formData.registrationSource !== 'WEBSITE'}
                          className="w-full rounded-lg border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm transition focus:border-neon focus:outline-none"
                        />
                      </div>
                    )}

                    <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 p-3">
                      <input
                        type="checkbox"
                        checked={newField.required}
                        onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                        disabled={formData.registrationSource !== 'WEBSITE'}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">Mark as Required Field</span>
                    </label>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={addCustomField}
                        disabled={formData.registrationSource !== 'WEBSITE'}
                        className="rounded-lg bg-neon px-3.5 py-2.5 text-sm font-semibold text-black transition enabled:hover:bg-neon/80 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add Field
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewField({ label: '', type: 'text', required: false, placeholder: '', options: '' })}
                        disabled={formData.registrationSource !== 'WEBSITE'}
                        className="rounded-lg border border-white/10 px-3.5 py-2.5 text-sm font-medium transition hover:bg-white/5"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </section>
              </section>
            </section>
            )}

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-5 py-2.5 text-sm rounded-lg border border-white/10 hover:bg-white/10 transition"
              >
                Cancel
              </button>

              <div className="flex gap-3">
                {activeSection !== 'eventInfo' && (
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="rounded-lg border border-white/10 px-5 py-2.5 text-sm transition hover:bg-white/5"
                  >
                    Back
                  </button>
                )}

                {activeSection !== 'registrationForm' && (
                  activeSection === 'registrationMode' && formData.registrationSource !== 'WEBSITE' ? (
                    <button
                      type="submit"
                      disabled={loading}
                      className="rounded-lg bg-neon px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-neon/80 disabled:opacity-50"
                    >
                      {loading ? (isEditMode ? 'Saving Changes...' : 'Creating Event...') : (isEditMode ? 'Save Changes' : 'Create Event')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="rounded-lg bg-neon px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-neon/80"
                    >
                      Next
                    </button>
                  )
                )}

                {activeSection === 'registrationForm' && (
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-lg bg-neon px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-neon/80 disabled:opacity-50"
                  >
                    {loading ? (isEditMode ? 'Saving Changes...' : 'Creating Event...') : (isEditMode ? 'Save Changes' : 'Create Event')}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </main>

      <Footer />

      {visibilityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-white/15 bg-black p-4 shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Custom Visibility Colleges</h3>
              <button
                type="button"
                onClick={() => setVisibilityModalOpen(false)}
                className="rounded-md px-2 py-1 text-xs text-muted transition hover:bg-white/10 hover:text-white"
              >
                Close
              </button>
            </div>

            <input
              type="text"
              value={collegeSearch}
              onChange={(e) => setCollegeSearch(e.target.value)}
              placeholder="Search colleges..."
              className="mb-3 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white transition focus:border-neon focus:outline-none"
            />

            <div className="max-h-72 overflow-y-auto rounded-lg border border-white/10">
              {collegesLoading ? (
                <div className="p-3 text-sm text-muted">Loading colleges...</div>
              ) : visibleColleges.length === 0 ? (
                <div className="p-3 text-sm text-muted">No colleges found.</div>
              ) : (
                visibleColleges.map((college) => (
                  <div
                    key={college.id}
                    className="flex w-full items-center justify-between border-b border-white/10 px-3 py-2.5 text-left text-sm text-white transition last:border-b-0 hover:bg-white/10"
                  >
                    <span>{college.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedVisibilityCollegeIds((prev) =>
                          prev.includes(college.id)
                            ? prev.filter((id) => id !== college.id)
                            : [...prev, college.id]
                        );
                        setError('');
                      }}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                        selectedVisibilityCollegeIds.includes(college.id) ? 'bg-neon' : 'bg-white/20'
                      }`}
                      aria-label={`Toggle visibility for ${college.name}`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-black transition-transform ${
                          selectedVisibilityCollegeIds.includes(college.id) ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-soft">
                Enabled: {selectedVisibilityCollegeIds.length} college(s)
              </p>
              <button
                type="button"
                onClick={() => setVisibilityModalOpen(false)}
                className="rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreateEventPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <CreateEventForm />
    </Suspense>
  );
}
