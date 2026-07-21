import React, { useEffect, useState } from 'react';

// The signature element: a live-looking IV monitor readout. Purely
// decorative/simulated on the landing page, but visually mirrors the real
// dashboard so a visitor immediately understands what the product watches.
const IVDripAnimation = () => {
  const [level, setLevel] = useState(78);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setLevel((prev) => {
        const next = prev - 0.6;
        return next < 6 ? 96 : next;
      });
      setTick((t) => t + 1);
    }, 900);
    return () => clearInterval(id);
  }, []);

  const rounded = Math.round(level);
  const band = rounded < 10 ? 'critical' : rounded <= 20 ? 'warning' : 'normal';
  const color = { normal: '#2F9E44', warning: '#E8A33D', critical: '#D64545' }[band];

  const fillHeight = 130 * (level / 100);
  const fillY = 40 + (130 - fillHeight);

  return (
    <div className="relative flex flex-col items-center">
      <svg viewBox="0 0 220 320" className="h-72 w-auto drop-shadow-sm" role="img" aria-label="Simulated IV bag fluid level monitor">
        {/* hook */}
        <path d="M110 8 C 96 8, 88 20, 96 30" stroke="#0B2027" strokeOpacity="0.25" strokeWidth="4" fill="none" strokeLinecap="round" />
        {/* bag outline */}
        <rect x="45" y="36" width="130" height="140" rx="16" fill="#ffffff" stroke="#0B2027" strokeOpacity="0.12" strokeWidth="2" />
        {/* fluid fill */}
        <clipPath id="bagClip">
          <rect x="47" y="38" width="126" height="136" rx="14" />
        </clipPath>
        <g clipPath="url(#bagClip)">
          <rect x="45" y={fillY} width="130" height={fillHeight + 10} fill={color} opacity="0.85" />
        </g>
        {/* level label */}
        <text x="110" y="112" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="30" fontWeight="600" fill="#0B2027">
          {rounded}%
        </text>
        {/* tube */}
        <line x1="110" y1="176" x2="110" y2="230" stroke="#0B2027" strokeOpacity="0.2" strokeWidth="3" />
        {/* drip chamber */}
        <rect x="98" y="196" width="24" height="34" rx="8" fill="#ffffff" stroke="#0B2027" strokeOpacity="0.15" strokeWidth="2" />
        <circle key={tick} cx="110" cy="200" r="4" fill={color} className="animate-drip" />
        {/* line to patient */}
        <line x1="110" y1="230" x2="110" y2="300" stroke="#0B2027" strokeOpacity="0.2" strokeWidth="3" strokeDasharray="2 5" />
      </svg>
      <div className="mt-2 flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-medium shadow-card">
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
        Room R104 · Bed A · live sensor reading
      </div>
    </div>
  );
};

export default IVDripAnimation;
