export function Emblem({ size = 190 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label="Smart Quiz"
      className="emblem-anim"
    >
      <defs>
        <linearGradient id="gA" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d9f5ea" />
          <stop offset="1" stopColor="#d7ccff" />
        </linearGradient>
        <linearGradient id="gB" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8aa2ff" />
          <stop offset="1" stopColor="#7a4fd0" />
        </linearGradient>
        <linearGradient id="gC" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a6dd6a" />
          <stop offset="1" stopColor="#5fb44a" />
        </linearGradient>
        <filter id="sh" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#5b3fa0" floodOpacity=".25" />
        </filter>
      </defs>
      <circle cx="100" cy="100" r="96" fill="none" stroke="#97d8c4" strokeWidth="2.5" strokeDasharray="3 9" strokeLinecap="round" />
      <circle cx="100" cy="100" r="86" fill="url(#gA)" stroke="#fff" strokeWidth="5" filter="url(#sh)" />
      <g filter="url(#sh)">
        <rect x="54" y="34" width="92" height="120" rx="14" fill="#fff" />
        <rect x="54" y="34" width="92" height="26" rx="14" fill="url(#gB)" />
        <rect x="54" y="48" width="92" height="12" fill="url(#gB)" />
        <rect x="66" y="43" width="34" height="7" rx="3.5" fill="#fff" opacity=".9" />
        <circle cx="70" cy="80" r="7.5" fill="#e8f7d6" />
        <path d="M66.3 80.2l2.6 2.7 5-5.4" fill="none" stroke="#5fb44a" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="84" y="77" width="48" height="6" rx="3" fill="#e6eaff" />
        <circle cx="70" cy="102" r="7.5" fill="#e8f7d6" />
        <path d="M66.3 102.2l2.6 2.7 5-5.4" fill="none" stroke="#5fb44a" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="84" y="99" width="40" height="6" rx="3" fill="#e6eaff" />
        <circle cx="70" cy="124" r="7.5" fill="#ece6ff" />
        <circle cx="70" cy="124" r="3" fill="#8aa2ff" />
        <rect x="84" y="121" width="44" height="6" rx="3" fill="#e6eaff" />
      </g>
      <g filter="url(#sh)">
        <circle cx="142" cy="148" r="26" fill="url(#gC)" stroke="#fff" strokeWidth="4" />
        <path d="M130 148.5l8.5 8.8 15-16.5" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <path d="M152 38 l4 11 11 4 -11 4 -4 11 -4 -11 -11 -4 11 -4z" fill="#ffd95e" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M44 120 l2.6 6.4 6.4 2.6 -6.4 2.6 -2.6 6.4 -2.6 -6.4 -6.4 -2.6 6.4 -2.6z" fill="#ff9fc4" stroke="#fff" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}
