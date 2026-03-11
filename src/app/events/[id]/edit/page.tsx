'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventParam = params.id as string;

  useEffect(() => {
    if (!eventParam) {
      router.replace('/organizer/my-events');
      return;
    }

    router.replace(`/events/create?edit=${eventParam}`);
  }, [eventParam]);

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center">
      <div className="text-white">Redirecting to event editor...</div>
    </div>
  );
}
