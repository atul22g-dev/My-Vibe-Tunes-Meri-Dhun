export default function WaveDivider() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[4] overflow-hidden leading-none">
      <div className="wave-anim">
        <svg
          className="h-[70px] w-1/2 shrink-0 md:h-[110px]"
          viewBox="0 0 1440 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            fill="#0f1a3d"
            d="M0,50 C120,10 240,90 360,50 C480,10 600,90 720,50 C840,10 960,90 1080,50 C1200,10 1320,90 1440,50 L1440,100 L0,100 Z"
          />
        </svg>
        <svg
          className="h-[70px] w-1/2 shrink-0 md:h-[110px]"
          viewBox="0 0 1440 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            fill="#0f1a3d"
            d="M0,50 C120,10 240,90 360,50 C480,10 600,90 720,50 C840,10 960,90 1080,50 C1200,10 1320,90 1440,50 L1440,100 L0,100 Z"
          />
        </svg>
      </div>
    </div>
  )
}
