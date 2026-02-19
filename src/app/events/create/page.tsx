'use client';

import { useMemo, useState } from 'react';

type StepId = 'eventInfo' | 'registrationMode' | 'registrationForm';

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

  const activeIndex = useMemo(
    () => steps.findIndex((step) => step.id === activeStep),
    [activeStep]
  );

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
          </div>
        ) : null}

        {activeStep === 'registrationMode' ? (
          <div>
            <h2 className="text-xl font-semibold">Registration Mode</h2>
            <p className="mt-2 text-sm opacity-80">
              Choose between website registration and external registration link.
            </p>
          </div>
        ) : null}

        {activeStep === 'registrationForm' ? (
          <div>
            <h2 className="text-xl font-semibold">Registration Form</h2>
            <p className="mt-2 text-sm opacity-80">
              Configure required fields and custom fields for registrations.
            </p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
