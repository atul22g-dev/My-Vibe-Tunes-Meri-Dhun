// Stroke-based SVG volume icon (Lucide style) — matches the app's clean minimal look.
// Variants: full / low / muted (based on volume level + muted flag).
export default function VolumeIcon({ volume, muted, className = 'size-4' }) {
  const off = muted || volume === 0
  const low = !off && volume < 50

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      {low && <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />}
      {!low && !off && (
        <>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </>
      )}
      {off && (
        <>
          <path d="m22 9-6 6" />
          <path d="m16 9 6 6" />
        </>
      )}
    </svg>
  )
}
