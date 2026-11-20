export function TarweejLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand-lockup">
      <span className="brand-mark" aria-hidden>
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M14 32L22 16L28 24L34 12"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="34" cy="12" r="3" fill="#F97316" />
        </svg>
      </span>
      {!compact ? (
        <span className="brand-text">
          <strong>ترويج</strong>
          <span>TARWEEJ</span>
        </span>
      ) : null}
    </span>
  );
}
