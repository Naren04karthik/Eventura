export default function ProfileAvatarFallback({ className = 'h-16 w-16' }: { className?: string }) {
  return (
    <svg
      className={`${className} text-white/80`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M15.75 6.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M4.5 20.25a7.5 7.5 0 0115 0" />
    </svg>
  );
}
