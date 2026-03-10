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
        // trigger browser camera permission 
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