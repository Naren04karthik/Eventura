'use client';

import { useMemo, useState } from 'react';

type StepId = 'eventInfo' | 'registrationMode' | 'registrationForm';
type CustomFieldType = 'text' | 'email' | 'phone' | 'number' | 'date' | 'textarea';

type CustomField = {
  id: string;
  label: string;
  type: CustomFieldType;
  required: boolean;
};

const steps: Array<{ id: StepId; title: string; description: string }> = [
  {
    id: 'eventInfo',
    title: 'Event Info',
    description: 'Basic details, timing, and venue',
  },
  {
    id: 'registrationMode',
    title: 'Registration Mode',
    description: 'Website form or external form link',
  },
  {
    id: 'registrationForm',
    title: 'Registration Form',
    description: 'Default and custom registration fields',
  },
];

export default function CreateEventPage() {
  const [activeStep, setActiveStep] = useState<StepId>('eventInfo');
  const [posterName, setPosterName] = useState('');
  const [eventInfo, setEventInfo] = useState({
    title: '',
    description: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    venue: '',
    capacity: 'Unlimited',
    visibility: 'College',
    tags: '',
    ticketPrice: '',
    isPaid: false,
    registrationSource: 'WEBSITE',
    externalFormUrl: '',
  });
//   added a custom fields so that one can add , remove and have some required controls.
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [newField, setNewField] = useState<{ label: string; type: CustomFieldType; required: boolean }>(
    {
      label: '',
      type: 'text',
      required: false,
    }
  );

  const activeIndex = useMemo(
    () => steps.findIndex((step) => step.id === activeStep),
    [activeStep]
  );

  const updateEventInfo =
    (field: keyof typeof eventInfo) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setEventInfo((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
    };

  const updateEventInfoSelect =
    (field: 'capacity' | 'visibility' | 'registrationSource') =>
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setEventInfo((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
    };

  const togglePaidEvent = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEventInfo((prev) => ({
      ...prev,
      isPaid: event.target.checked,
      ticketPrice: event.target.checked ? prev.ticketPrice : '',
    }));
  };

  const addCustomField = () => {
    const label = newField.label.trim();
    if (!label) {
      return;
    }

    setCustomFields((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        label,
        type: newField.type,
        required: newField.required,
      },
    ]);

    setNewField({
      label: '',
      type: 'text',
      required: false,
    });
  };

  const removeCustomField = (fieldId: string) => {
    setCustomFields((prev) => prev.filter((field) => field.id !== fieldId));
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Create Event</h1>
        <p className="mt-2 text-sm opacity-80">
          Three-step event setup flow for organizers.
        </p>
      </header>

      <nav aria-label="Create event steps" className="mb-8">
        <ol className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {steps.map((step, index) => {
            const isActive = step.id === activeStep;
            const isCompleted = index < activeIndex;

            return (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => setActiveStep(step.id)}
                  className="w-full rounded-lg border p-4 text-left transition"
                  aria-current={isActive ? 'step' : undefined}
                >
                  <p className="text-xs font-medium opacity-70">Step {index + 1}</p>
                  <p className="mt-1 text-base font-semibold">{step.title}</p>
                  <p className="mt-1 text-sm opacity-80">{step.description}</p>
                  {isCompleted ? (
                    <p className="mt-2 text-xs font-medium">Completed</p>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <section className="rounded-xl border p-5 sm:p-6">
        {activeStep === 'eventInfo' ? (
          <div>
            <h2 className="text-xl font-semibold">Event Info</h2>
            <p className="mt-2 text-sm opacity-80">
              Add poster, title, description, date, time, and venue details.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="poster" className="mb-2 block text-sm font-medium">
                  Poster Upload
                </label>
                <input
                  id="poster"
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    setPosterName(file?.name ?? '');
                  }}
                  className="block w-full rounded-lg border p-2 text-sm"
                />
                {posterName ? (
                  <p className="mt-2 text-xs opacity-80">Selected: {posterName}</p>
                ) : null}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="title" className="mb-2 block text-sm font-medium">
                  Event Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={eventInfo.title}
                  onChange={updateEventInfo('title')}
                  placeholder="Enter event title"
                  className="w-full rounded-lg border p-2 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="mb-2 block text-sm font-medium">
                  Description
                </label>
                <textarea
                  id="description"
                  value={eventInfo.description}
                  onChange={updateEventInfo('description')}
                  placeholder="Describe your event"
                  rows={4}
                  className="w-full rounded-lg border p-2 text-sm"
                />
              </div>

              <div>
                <label htmlFor="eventDate" className="mb-2 block text-sm font-medium">
                  Event Date
                </label>
                <input
                  id="eventDate"
                  type="date"
                  value={eventInfo.eventDate}
                  onChange={updateEventInfo('eventDate')}
                  className="w-full rounded-lg border p-2 text-sm"
                />
              </div>

              <div>
                <label htmlFor="startTime" className="mb-2 block text-sm font-medium">
                  Start Time
                </label>
                <input
                  id="startTime"
                  type="time"
                  value={eventInfo.startTime}
                  onChange={updateEventInfo('startTime')}
                  className="w-full rounded-lg border p-2 text-sm"
                />
              </div>

              <div>
                <label htmlFor="endTime" className="mb-2 block text-sm font-medium">
                  End Time
                </label>
                <input
                  id="endTime"
                  type="time"
                  value={eventInfo.endTime}
                  onChange={updateEventInfo('endTime')}
                  className="w-full rounded-lg border p-2 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="venue" className="mb-2 block text-sm font-medium">
                  Venue
                </label>
                <input
                  id="venue"
                  type="text"
                  value={eventInfo.venue}
                  onChange={updateEventInfo('venue')}
                  placeholder="Enter venue or location"
                  className="w-full rounded-lg border p-2 text-sm"
                />
              </div>

              <div>
                <label htmlFor="capacity" className="mb-2 block text-sm font-medium">
                  Capacity
                </label>
                <select
                  id="capacity"
                  value={eventInfo.capacity}
                  onChange={updateEventInfoSelect('capacity')}
                  className="w-full rounded-lg border p-2 text-sm"
                >
                  <option value="Unlimited">Unlimited</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="200">200</option>
                  <option value="500">500</option>
                </select>
              </div>

              <div>
                <label htmlFor="visibility" className="mb-2 block text-sm font-medium">
                  Visibility
                </label>
                <select
                  id="visibility"
                  value={eventInfo.visibility}
                  onChange={updateEventInfoSelect('visibility')}
                  className="w-full rounded-lg border p-2 text-sm"
                >
                  <option value="College">College</option>
                  <option value="Public">Public</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="tags" className="mb-2 block text-sm font-medium">
                  Tags
                </label>
                <input
                  id="tags"
                  type="text"
                  value={eventInfo.tags}
                  onChange={updateEventInfo('tags')}
                  placeholder="Example: coding, workshop, hackathon"
                  className="w-full rounded-lg border p-2 text-sm"
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-3">
                <input
                  id="isPaid"
                  type="checkbox"
                  checked={eventInfo.isPaid}
                  onChange={togglePaidEvent}
                  className="h-4 w-4"
                />
                <label htmlFor="isPaid" className="text-sm font-medium">
                  This is a paid event
                </label>
              </div>

              {eventInfo.isPaid ? (
                <div>
                  <label htmlFor="ticketPrice" className="mb-2 block text-sm font-medium">
                    Ticket Price
                  </label>
                  <input
                    id="ticketPrice"
                    type="number"
                    min="0"
                    value={eventInfo.ticketPrice}
                    onChange={updateEventInfo('ticketPrice')}
                    placeholder="Enter price"
                    className="w-full rounded-lg border p-2 text-sm"
                  />
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {activeStep === 'registrationMode' ? (
          <div>
            <h2 className="text-xl font-semibold">Registration Mode</h2>
            <p className="mt-2 text-sm opacity-80">
              Choose between website registration and external registration link.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="registrationSource" className="mb-2 block text-sm font-medium">
                  Registration Source
                </label>
                <select
                  id="registrationSource"
                  value={eventInfo.registrationSource}
                  onChange={updateEventInfoSelect('registrationSource')}
                  className="w-full rounded-lg border p-2 text-sm"
                >
                  <option value="WEBSITE">Website Form</option>
                  <option value="GOOGLE_FORM">Google Form</option>
                </select>
              </div>

              {eventInfo.registrationSource === 'GOOGLE_FORM' ? (
                <div className="md:col-span-2">
                  <label htmlFor="externalFormUrl" className="mb-2 block text-sm font-medium">
                    Google Form URL
                  </label>
                  <input
                    id="externalFormUrl"
                    type="url"
                    value={eventInfo.externalFormUrl}
                    onChange={updateEventInfo('externalFormUrl')}
                    placeholder="https://docs.google.com/forms/..."
                    className="w-full rounded-lg border p-2 text-sm"
                  />
                </div>
              ) : (
                <div className="md:col-span-2 rounded-lg border p-4">
                  <p className="text-sm font-medium">Website registration enabled</p>
                  <p className="mt-1 text-sm opacity-80">
                    Participants will register through Eventura form fields.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {activeStep === 'registrationForm' ? (
          <div>
            <h2 className="text-xl font-semibold">Registration Form</h2>
            <p className="mt-2 text-sm opacity-80">
              Configure required fields and custom fields for registrations.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="md:col-span-2 rounded-lg border p-4">
                <h3 className="text-base font-semibold">Add Custom Field</h3>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="md:col-span-2">
                    <label htmlFor="fieldLabel" className="mb-2 block text-sm font-medium">
                      Field Label
                    </label>
                    <input
                      id="fieldLabel"
                      type="text"
                      value={newField.label}
                      onChange={(event) =>
                        setNewField((prev) => ({
                          ...prev,
                          label: event.target.value,
                        }))
                      }
                      placeholder="Example: Department"
                      className="w-full rounded-lg border p-2 text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="fieldType" className="mb-2 block text-sm font-medium">
                      Field Type
                    </label>
                    <select
                      id="fieldType"
                      value={newField.type}
                      onChange={(event) =>
                        setNewField((prev) => ({
                          ...prev,
                          type: event.target.value as CustomFieldType,
                        }))
                      }
                      className="w-full rounded-lg border p-2 text-sm"
                    >
                      <option value="text">Text</option>
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="textarea">Textarea</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={newField.required}
                      onChange={(event) =>
                        setNewField((prev) => ({
                          ...prev,
                          required: event.target.checked,
                        }))
                      }
                      className="h-4 w-4"
                    />
                    Required field
                  </label>

                  <button
                    type="button"
                    onClick={addCustomField}
                    className="rounded-lg border px-4 py-2 text-sm font-medium"
                  >
                    Add Field
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 rounded-lg border p-4">
                <h3 className="text-base font-semibold">Custom Fields</h3>
                {customFields.length === 0 ? (
                  <p className="mt-3 text-sm opacity-80">No custom fields added yet.</p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {customFields.map((field) => (
                      <li key={field.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <p className="text-sm font-medium">{field.label}</p>
                          <p className="text-xs opacity-80">
                            Type: {field.type} • {field.required ? 'Required' : 'Optional'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCustomField(field.id)}
                          className="rounded-lg border px-3 py-1.5 text-xs font-medium"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
