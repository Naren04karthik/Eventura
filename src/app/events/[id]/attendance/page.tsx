'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/auth-context';
import { Html5Qrcode } from 'html5-qrcode';

interface CurrentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status?: string;
  profileImage?: string | null;
}

interface RegistrationRow {
  id: string;
  status: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    profileImage?: string | null;
  };
}

export default function EventAttendancePage() {
  const router = useRouter();
  const params = useParams();
  const eventIdentifier = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const { user } = useAuth();
  const currentUser = user;
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [rows, setRows] = useState<RegistrationRow[]>([]);
  const [eventTitle, setEventTitle] = useState('Event');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const loadPage = async () => {
    if (!eventIdentifier) return;

    try {
      setLoading(true);
      if (!currentUser) {
        router.push('/login');
        return;
      }

      const regsRes = await fetch(`/api/events/${eventIdentifier}/registrations?limit=500`);
      const regsPayload = await regsRes.json().catch(() => null);

      if (!regsRes.ok) {
        setError(regsPayload?.error || regsPayload?.message || 'Failed to load registrations');
        return;
      }

      const registrations = regsPayload?.data?.registrations || [];
      const title = regsPayload?.data?.event?.title || 'Event';
      setRows(registrations);
      setEventTitle(title);
      setError(null);
    } catch {
      setError('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, [eventIdentifier]);

  const handleMarkByRegistration = async (registrationId: string) => {
    if (!eventIdentifier) return;

    setMarkingId(registrationId);
    setNotice(null);
    setError(null);

    try {
      const res = await fetch(`/api/events/${eventIdentifier}/attendance/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId }),
      });
      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        setError(payload?.message || 'Failed to mark attendance');
        return;
      }

      setRows((prev) =>
        prev.map((row) =>
          row.id === registrationId
            ? {
                ...row,
                status: 'ATTENDED',
              }
            : row
        )
      );

      setNotice(payload?.message || 'Attendance marked successfully');
    } catch {
      setError('Failed to mark attendance');
    } finally {
      setMarkingId(null);
    }
  };

  const handleScanMark = async (decodedText: string) => {
    if (!eventIdentifier) return;

    try {
      const res = await fetch(`/api/events/${eventIdentifier}/verify-attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrData: decodedText }),
      });

      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        setError(payload?.message || 'Failed to verify attendance');
        setNotice(null);
        return;
      }

      setNotice(payload?.message || 'Attendance marked successfully');
      setError(null);
      await loadPage();
    } catch {
      setError('Failed to verify attendance');
      setNotice(null);
    }
  };

  useEffect(() => {
    const startScanner = async () => {
      if (!scanning || scannerRef.current) return;
      try {
        // Trigger browser camera permission prompt before starting scanner.
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((track) => track.stop());

        const scanner = new Html5Qrcode('attendance-qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
            aspectRatio: 1,
          },
          async (decodedText) => {
            if (!scannerRef.current) return;
            await scannerRef.current.stop().catch(() => undefined);
            scannerRef.current = null;
            setScanning(false);
            await handleScanMark(decodedText);
          },
          () => {
            // Ignore per-frame decode errors.
          }
        );

        setCameraReady(true);
      } catch (err: any) {
        setCameraReady(false);
        setScanning(false);
        if (err?.name === 'NotAllowedError') {
          setError('Camera permission denied. Please allow camera access and try again.');
        } else {
          setError('Unable to start camera scanner. Check camera permissions and device availability.');
        }
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => undefined);
        scannerRef.current = null;
      }
      setCameraReady(false);
    };
  }, [scanning]);

  const stopScanner = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => undefined);
      scannerRef.current = null;
    }
    setCameraReady(false);
    setScanning(false);
  };

  const filteredRows = rows.filter((row) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    const name = `${row.user.firstName} ${row.user.lastName}`.toLowerCase();
    return name.includes(query) || row.user.email.toLowerCase().includes(query);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center text-white">
        Loading attendance...
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-ink text-white flex flex-col">
      <Navbar user={currentUser} />

      <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-12">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-normal mb-2">Attendance</h1>
            <p className="text-muted">{eventTitle}</p>
          </div>
          <button
            onClick={() => router.push(`/events/${eventIdentifier}`)}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/5"
          >
            Back to Event
          </button>
        </div>

        {notice && (
          <div className="mb-4 rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-300">
            {notice}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <section className="mb-6 rounded-2xl border border-white/10 bg-black/50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">QR Scanner</h2>
            {!scanning ? (
              <button
                onClick={() => {
                  setNotice(null);
                  setError(null);
                  setScanning(true);
                }}
                className="rounded-lg bg-neon px-4 py-2 text-sm font-semibold text-black hover:bg-neon/85"
              >
                [ Scan ]
              </button>
            ) : (
              <button
                onClick={stopScanner}
                className="rounded-lg border border-red-500/40 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10"
              >
                Stop Scanner
              </button>
            )}
          </div>
          {scanning && (
            <div className="space-y-3">
              <div
                id="attendance-qr-reader"
                className="mx-auto max-w-xs overflow-hidden rounded-lg border border-white/10 bg-black/40"
              />
              <p className="text-xs text-muted">
                {cameraReady ? 'Camera is active. Point it to participant QR code to auto-mark attendance.' : 'Initializing camera...'}
              </p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Registrations</h2>
            <p className="text-xs text-muted">{filteredRows.length} shown</p>
          </div>

          <div className="mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email"
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder-white/40 focus:border-white/30 focus:outline-none"
            />
          </div>

          {filteredRows.length === 0 ? (
            <p className="text-sm text-muted">No registrations found for this event.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-3 py-3">Participant</th>
                    <th className="px-3 py-3">Registered</th>
                    <th className="px-3 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => {
                    const isMarked = row.status === 'ATTENDED';
                    return (
                      <tr key={row.id} className="border-b border-white/5">
                        <td className="px-3 py-3">
                          <p className="font-medium text-white">
                            {row.user.firstName} {row.user.lastName}
                          </p>
                          <p className="text-xs text-muted">{row.user.email}</p>
                        </td>
                        <td className="px-3 py-3 text-sm text-muted">
                          {new Date(row.createdAt).toLocaleString()}
                        </td>
                        <td className="px-3 py-3">
                          <button
                            onClick={() => handleMarkByRegistration(row.id)}
                            disabled={isMarked || markingId === row.id}
                            className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isMarked
                              ? 'Marked'
                              : markingId === row.id
                                ? 'Marking...'
                                : 'Mark Attendance'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
