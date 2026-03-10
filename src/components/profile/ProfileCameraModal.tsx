'use client';

import { createPortal } from 'react-dom';

interface ProfileCameraModalProps {
  isMounted: boolean;
  isOpen: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onCancel: () => void;
  onCapture: () => void;
}

export default function ProfileCameraModal({
  isMounted,
  isOpen,
  videoRef,
  onCancel,
  onCapture,
}: ProfileCameraModalProps) {
  if (!isMounted || !isOpen) {
    return null;
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '700px',
          height: '500px',
          borderRadius: '24px',
          backgroundColor: '#0a0a0a',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            position: 'relative',
            backgroundColor: 'black',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />

          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '32px',
                left: '32px',
                right: '32px',
                bottom: '32px',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '24px',
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '16px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
        >
          <button
            onClick={onCancel}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            type="button"
            style={{
              flex: 1,
              padding: '12px 20px',
              borderRadius: '999px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backgroundColor: 'transparent',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onCapture}
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(239, 68, 68, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
            type="button"
            style={{
              flex: 1,
              padding: '12px 20px',
              borderRadius: '999px',
              border: 'none',
              background: 'linear-gradient(90deg, rgb(236 72 153), rgb(239 68 68), rgb(249 115 22))',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <svg style={{ width: '20px', height: '20px' }} fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="8" />
            </svg>
            Capture
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}