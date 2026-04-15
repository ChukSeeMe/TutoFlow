"use client";

/**
 * Portal Scene Illustrations
 *
 * AI-generated style SVG illustrations for each portal hero area.
 * All scenes are pure SVG — no stock images, no external URLs.
 */

// ── Student: Night Study Scene ───────────────────────────────────────────────

export function StudentNightScene({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 190"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Sky gradient */}
        <linearGradient id="sn-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#04040f" />
          <stop offset="100%" stopColor="#0c0c28" />
        </linearGradient>
        {/* Desk gradient */}
        <linearGradient id="sn-desk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#131130" />
          <stop offset="100%" stopColor="#0a0820" />
        </linearGradient>
        {/* Lamp warm glow */}
        <radialGradient id="sn-lamp" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#fbbf24" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
        {/* Screen blue glow */}
        <radialGradient id="sn-screen" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#38bdf8" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
        </radialGradient>
        {/* Purple ambient */}
        <radialGradient id="sn-ambient" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#155209" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#155209" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ── Background ──────────────────────────────────────────────────── */}
      <rect width="400" height="190" fill="url(#sn-sky)" />

      {/* Ambient glows */}
      <ellipse cx="90"  cy="145" rx="130" ry="90"  fill="url(#sn-lamp)"    />
      <ellipse cx="230" cy="130" rx="120" ry="80"  fill="url(#sn-screen)"  />
      <ellipse cx="210" cy="95"  rx="180" ry="110" fill="url(#sn-ambient)" />

      {/* ── Stars ──────────────────────────────────────────────────────── */}
      {[
        [22,14], [50,8], [85,22], [130,10], [168,18],
        [200,6], [240,16], [170,32], [40,38],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.5 : 1} fill="white" opacity={0.3 + (i % 3) * 0.15} />
      ))}

      {/* ── Window (top-right) ─────────────────────────────────────────── */}
      <rect x="268" y="12" width="118" height="108" rx="5" fill="#080818" stroke="#171740" strokeWidth="2.5" />
      {/* Window panes */}
      <line x1="327" y1="12"  x2="327" y2="120" stroke="#171740" strokeWidth="2" />
      <line x1="268" y1="64"  x2="386" y2="64"  stroke="#171740" strokeWidth="2" />

      {/* Building silhouettes */}
      <rect x="271" y="90"  width="14" height="30" fill="#070714" />
      <rect x="288" y="98"  width="10" height="22" fill="#070714" />
      <rect x="344" y="82"  width="18" height="38" fill="#070714" />
      <rect x="365" y="95"  width="12" height="25" fill="#070714" />
      <rect x="300" y="105" width="8"  height="15" fill="#070714" />

      {/* City lights — left pane */}
      {[
        [279,26,1.5,"#fbbf24",0.9], [291,22,1,"#f59e0b",0.8],
        [305,31,1.5,"#fef08a",0.7], [283,44,1,"#fb923c",0.85],
        [297,40,2,"#fbbf24",0.9],   [314,27,1,"#fde68a",0.7],
        [277,56,1,"#60a5fa",0.6],   [308,52,1.5,"#fbbf24",0.8],
        [292,67,1,"#fbbf24",0.7],   [315,72,1.5,"#f59e0b",0.75],
        [280,80,2,"#fde68a",0.5],   [295,86,1,"#fb923c",0.7],
      ].map(([x, y, r, color, op], i) => (
        <circle key={`cl-${i}`} cx={x as number} cy={y as number} r={r as number} fill={color as string} opacity={op as number} />
      ))}

      {/* City lights — right pane */}
      {[
        [340,24,1.5,"#fbbf24",0.85], [353,19,1,"#f59e0b",0.9],
        [368,29,1.5,"#fef08a",0.7],  [337,46,1,"#60a5fa",0.7],
        [357,40,2,"#fbbf24",0.85],   [374,48,1.5,"#fde68a",0.65],
        [345,71,1,"#fb923c",0.75],   [362,80,2,"#60a5fa",0.5],
        [378,68,1,"#fbbf24",0.7],    [338,88,1.5,"#fde68a",0.6],
        [371,96,1,"#fbbf24",0.8],    [350,100,1.5,"#f59e0b",0.65],
      ].map(([x, y, r, color, op], i) => (
        <circle key={`cr-${i}`} cx={x as number} cy={y as number} r={r as number} fill={color as string} opacity={op as number} />
      ))}

      {/* ── Desk surface ───────────────────────────────────────────────── */}
      <rect x="0" y="148" width="400" height="42" fill="url(#sn-desk)" />
      <rect x="0" y="146" width="400" height="4"  fill="#1e1c4a" opacity="0.8" />

      {/* ── Desk lamp (left) ───────────────────────────────────────────── */}
      <rect x="66"  y="146" width="20" height="6"  rx="3"  fill="#252356" />
      <rect x="74"  y="102" width="4"  height="46" rx="2"  fill="#252356" />
      <rect x="58"  y="102" width="22" height="4"  rx="2"  fill="#252356" />
      <polygon points="48,76 92,76 85,104 55,104" fill="#3a3870" />
      <polygon points="51,78 89,78 82,102 58,102" fill="#4c4a8a" />
      {/* Lamp warm pool of light on desk */}
      <ellipse cx="72"  cy="148" rx="55" ry="12" fill="#fbbf24" opacity="0.12" />
      <ellipse cx="72"  cy="104" rx="28" ry="8"  fill="#fbbf24" opacity="0.2"  />

      {/* ── Books (far left) ────────────────────────────────────────────── */}
      <rect x="10" y="130" width="44" height="9"  rx="2" fill="#27a81b" />
      <rect x="10" y="121" width="40" height="9"  rx="2" fill="#1c660c" />
      <rect x="13" y="112" width="36" height="9"  rx="2" fill="#155209" />
      <rect x="10" y="130" width="4"  height="9"  rx="1" fill="#3ec436" />
      <rect x="10" y="121" width="3.5" height="9" rx="1" fill="#1c660c" />
      <rect x="13" y="112" width="3"  height="9"  rx="1" fill="#103d07" />

      {/* ── Coffee cup ──────────────────────────────────────────────────── */}
      <rect x="148" y="138" width="20" height="14" rx="3.5" fill="#1a173c" />
      <rect x="148" y="138" width="20" height="4"  rx="2"   fill="#2d2960" />
      <path d="M168 142 Q177 142 177 148 Q177 153 168 153" stroke="#1a173c" strokeWidth="2.5" fill="none" />
      {/* Steam */}
      <path d="M154 136 Q156 129 154 122" stroke="#1c660c" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.5" />
      <path d="M161 134 Q163 127 161 120" stroke="#1c660c" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.35" />

      {/* ── Person (silhouette, leaning forward) ─────────────────────────── */}
      {/* Head */}
      <ellipse cx="213" cy="100" rx="17" ry="19" fill="#141228" />
      {/* Neck */}
      <rect x="207" y="117" width="13" height="9"  rx="4" fill="#141228" />
      {/* Torso */}
      <rect x="190" y="124" width="46" height="28" rx="10" fill="#0f0d22" />
      {/* Arms reaching to keyboard */}
      <rect x="183" y="136" width="60" height="12" rx="6" fill="#0f0d22" />

      {/* ── Laptop ─────────────────────────────────────────────────────── */}
      {/* Screen */}
      <rect x="194" y="107" width="88" height="46" rx="5"  fill="#091420"  />
      <rect x="194" y="107" width="88" height="46" rx="5"  stroke="#1e3a5f" strokeWidth="1.5" fill="none" />
      {/* Screen glow overlay */}
      <rect x="194" y="107" width="88" height="46" rx="5"  fill="url(#sn-screen)" opacity="0.6" />
      {/* Screen content lines */}
      <rect x="202" y="116" width="44" height="2.5" rx="1" fill="#38bdf8" opacity="0.8" />
      <rect x="202" y="122" width="60" height="2"   rx="1" fill="#818cf8" opacity="0.55" />
      <rect x="202" y="128" width="32" height="2"   rx="1" fill="#38bdf8" opacity="0.45" />
      <rect x="202" y="134" width="52" height="2"   rx="1" fill="#818cf8" opacity="0.65" />
      <rect x="202" y="140" width="38" height="2"   rx="1" fill="#34d399" opacity="0.5" />
      <rect x="202" y="146" width="55" height="2"   rx="1" fill="#818cf8" opacity="0.55" />
      {/* Laptop base */}
      <rect x="190" y="153" width="96" height="6"  rx="3"  fill="#1a1838" />
      {/* Trackpad */}
      <rect x="222" y="155" width="32" height="3"  rx="1.5" fill="#131228" />

      {/* ── Notebook + pen (right of laptop) ──────────────────────────── */}
      <rect x="295" y="140" width="50" height="12" rx="2" fill="#1a1840" />
      <rect x="295" y="140" width="6"  height="12" rx="1" fill="#1c660c" opacity="0.7" />
      <rect x="297" y="143" width="40" height="1.5" rx="0.75" fill="#27a81b" opacity="0.4" />
      <rect x="297" y="147" width="32" height="1.5" rx="0.75" fill="#27a81b" opacity="0.3" />
      {/* Pen */}
      <rect x="350" y="136" width="3" height="22" rx="1.5" fill="#a5b4fc" opacity="0.8" transform="rotate(-12 350 136)" />
    </svg>
  );
}


// ── Parent: Home Review Scene ────────────────────────────────────────────────

export function ParentReviewScene({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 160"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="pr-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#040d1a" />
          <stop offset="100%" stopColor="#071428" />
        </linearGradient>
        <linearGradient id="pr-desk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#0c1830" />
          <stop offset="100%" stopColor="#080f20" />
        </linearGradient>
        <radialGradient id="pr-glow1" cx="40%" cy="60%" r="50%">
          <stop offset="0%"   stopColor="#0ea5e9" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="pr-glow2" cx="70%" cy="40%" r="50%">
          <stop offset="0%"   stopColor="#1c660c" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#1c660c" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="pr-warm" cx="15%" cy="80%" r="40%">
          <stop offset="0%"   stopColor="#f59e0b" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Background */}
      <rect width="400" height="160" fill="url(#pr-bg)" />
      <ellipse cx="160" cy="100" rx="180" ry="100" fill="url(#pr-glow1)" />
      <ellipse cx="280" cy="70"  rx="160" ry="100" fill="url(#pr-glow2)" />
      <ellipse cx="60"  cy="130" rx="100" ry="70"  fill="url(#pr-warm)"  />

      {/* Decorative circuit dots (top-left) */}
      {[[15,20],[32,15],[48,22],[22,35],[40,38],[55,30]].map(([x,y],i) => (
        <circle key={`d${i}`} cx={x} cy={y} r="1.5" fill="#1c660c" opacity="0.3" />
      ))}
      <line x1="15" y1="20" x2="32" y2="15" stroke="#1c660c" strokeWidth="0.8" opacity="0.2" />
      <line x1="32" y1="15" x2="48" y2="22" stroke="#1c660c" strokeWidth="0.8" opacity="0.2" />
      <line x1="22" y1="35" x2="40" y2="38" stroke="#1c660c" strokeWidth="0.8" opacity="0.2" />
      <line x1="40" y1="38" x2="55" y2="30" stroke="#1c660c" strokeWidth="0.8" opacity="0.2" />

      {/* Desk surface */}
      <rect x="0" y="118" width="400" height="42" fill="url(#pr-desk)" />
      <rect x="0" y="116" width="400" height="4"  fill="#0e1f3a" />

      {/* ── Tablet/iPad showing progress chart ──────────────────────────── */}
      {/* Tablet body */}
      <rect x="155" y="68" width="110" height="72" rx="8" fill="#0a1a2e" stroke="#1a3050" strokeWidth="2" />
      {/* Screen */}
      <rect x="161" y="74" width="98"  height="58" rx="4" fill="#060e1c" />
      {/* Chart grid lines */}
      <line x1="163" y1="100" x2="257" y2="100" stroke="#1a3050" strokeWidth="0.8" opacity="0.8" />
      <line x1="163" y1="112" x2="257" y2="112" stroke="#1a3050" strokeWidth="0.8" opacity="0.8" />
      <line x1="163" y1="88"  x2="257" y2="88"  stroke="#1a3050" strokeWidth="0.8" opacity="0.8" />
      {/* Chart bars */}
      <rect x="170" y="103" width="12" height="24" rx="2" fill="#27a81b" opacity="0.85" />
      <rect x="187" y="95"  width="12" height="32" rx="2" fill="#1c660c" opacity="0.85" />
      <rect x="204" y="88"  width="12" height="39" rx="2" fill="#27a81b" opacity="0.9" />
      <rect x="221" y="80"  width="12" height="47" rx="2" fill="#10b981" opacity="0.9" />
      <rect x="238" y="83"  width="12" height="44" rx="2" fill="#10b981" opacity="0.95" />
      {/* X-axis labels */}
      <rect x="169" y="130" width="14" height="2" rx="1" fill="#1c660c" opacity="0.4" />
      <rect x="186" y="130" width="14" height="2" rx="1" fill="#27a81b" opacity="0.4" />
      <rect x="203" y="130" width="14" height="2" rx="1" fill="#27a81b" opacity="0.4" />
      <rect x="220" y="130" width="14" height="2" rx="1" fill="#27a81b" opacity="0.4" />
      <rect x="237" y="130" width="14" height="2" rx="1" fill="#27a81b" opacity="0.4" />
      {/* Chart title bar */}
      <rect x="163" y="76" width="50" height="3" rx="1.5" fill="#38bdf8" opacity="0.7" />
      <rect x="216" y="76" width="30" height="3" rx="1.5" fill="#818cf8" opacity="0.4" />
      {/* Upward trend line overlay */}
      <polyline points="176,126 193,118 210,110 227,99 244,102" stroke="#10b981" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      {/* Tablet home button */}
      <circle cx="210" cy="138" r="3.5" fill="#0e1f3a" stroke="#1a3050" strokeWidth="1.5" />

      {/* ── Parent figure (left, seated) ────────────────────────────────── */}
      {/* Head */}
      <ellipse cx="108" cy="84" rx="16" ry="18" fill="#0d1730" />
      {/* Hair */}
      <ellipse cx="108" cy="71" rx="16" ry="8" fill="#1a2545" />
      {/* Neck */}
      <rect x="102" y="100" width="12" height="8" rx="4" fill="#0d1730" />
      {/* Body */}
      <rect x="85" y="106" width="46" height="30" rx="10" fill="#0a1428" />
      {/* Arm reaching to tablet */}
      <rect x="108" y="114" width="50" height="10" rx="5" fill="#0a1428" />
      {/* Hand on tablet */}
      <ellipse cx="153" cy="118" rx="8" ry="6" fill="#0d1730" />

      {/* ── Child figure (right side) ──────────────────────────────────── */}
      <ellipse cx="310" cy="90"  rx="13" ry="15" fill="#0d1730" />
      {/* Child hair */}
      <ellipse cx="310" cy="78"  rx="13" ry="7"  fill="#1e3050" />
      <rect x="305" y="103" width="10" height="7"  rx="3" fill="#0d1730" />
      <rect x="290" y="108" width="40" height="26" rx="9" fill="#0a1428" />

      {/* ── Stars/particles ──────────────────────────────────────────────── */}
      {[[30,55],[45,42],[360,30],[375,48],[350,20],[380,15]].map(([x,y],i) => (
        <circle key={`s${i}`} cx={x} cy={y} r="1.2" fill="white" opacity={0.2 + i*0.05} />
      ))}

      {/* ── Floating checkmark badge (top right) ─────────────────────────── */}
      <circle cx="365" cy="55" r="20" fill="#10b981" opacity="0.12" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.3" />
      <path d="M356 55 L362 62 L374 48" stroke="#10b981" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />

      {/* ── Floating progress ring (top) ──────────────────────────────────── */}
      <circle cx="60" cy="38" r="22" fill="none" stroke="#1c660c" strokeWidth="2" strokeOpacity="0.15" />
      <circle cx="60" cy="38" r="22" fill="none" stroke="#1c660c" strokeWidth="2.5" strokeDasharray="100 38.5"
        strokeLinecap="round" strokeOpacity="0.7"
        transform="rotate(-90 60 38)"
      />
      <text x="60" y="43" textAnchor="middle" fill="#a5b4fc" fontSize="9" fontWeight="bold">72%</text>
    </svg>
  );
}


// ── Tutor: Dashboard Preview Scene ───────────────────────────────────────────

export function TutorPlanningScene({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 224 130"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Base background */}
        <linearGradient id="tp-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#070712" />
          <stop offset="100%" stopColor="#0c0c1e" />
        </linearGradient>
        {/* Subtle brand glow — bottom-left */}
        <radialGradient id="tp-g1" cx="20%" cy="90%" r="55%">
          <stop offset="0%"   stopColor="#1c660c" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#1c660c" stopOpacity="0" />
        </radialGradient>
        {/* Accent glow — top-right */}
        <radialGradient id="tp-g2" cx="90%" cy="15%" r="45%">
          <stop offset="0%"   stopColor="#27a81b" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#27a81b" stopOpacity="0" />
        </radialGradient>
        {/* Card surface */}
        <linearGradient id="tp-card" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.055" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.025" />
        </linearGradient>
        {/* Progress track */}
        <linearGradient id="tp-track" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#27a81b" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
        <linearGradient id="tp-track2" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
        <linearGradient id="tp-track3" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#10b981" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
        <linearGradient id="tp-track4" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
      </defs>

      {/* ── Background ────────────────────────────────────────────────────── */}
      <rect width="224" height="130" fill="url(#tp-bg)" />
      <ellipse cx="44"  cy="117" rx="100" ry="65"  fill="url(#tp-g1)" />
      <ellipse cx="202" cy="20"  rx="80"  ry="55"  fill="url(#tp-g2)" />

      {/* Subtle dot grid */}
      {Array.from({ length: 6 }, (_, row) =>
        Array.from({ length: 10 }, (_, col) => (
          <circle
            key={`grid-${row}-${col}`}
            cx={14 + col * 22}
            cy={12 + row * 22}
            r="0.7"
            fill="white"
            opacity="0.04"
          />
        ))
      )}

      {/* ── Top header strip ──────────────────────────────────────────────── */}
      <rect x="0" y="0" width="224" height="20" fill="#ffffff" fillOpacity="0.025" />
      <rect x="0" y="19" width="224" height="0.75" fill="#ffffff" fillOpacity="0.07" />
      {/* Brand dot + label */}
      <rect x="9" y="6.5" width="7" height="7" rx="2"
        fill="#1c660c" />
      <rect x="20" y="8"  width="28" height="2.5" rx="1.25" fill="#ffffff" fillOpacity="0.5"  />
      <rect x="20" y="12" width="16" height="1.5" rx="0.75"  fill="#ffffff" fillOpacity="0.2"  />
      {/* AI ready pill — top right */}
      <rect x="175" y="5" width="42" height="11" rx="5.5"
        fill="#27a81b" fillOpacity="0.15"
        stroke="#27a81b" strokeWidth="0.75" strokeOpacity="0.5" />
      <circle cx="183" cy="10.5" r="2" fill="#27a81b" opacity="0.9" />
      <rect x="187" y="8.5" width="22" height="2.5" rx="1.25" fill="#27a81b" opacity="0.7" />

      {/* ── Three metric cards (row) ───────────────────────────────────────── */}
      {/* Card 1 — Students */}
      <rect x="8"  y="27" width="60" height="36" rx="5" fill="url(#tp-card)" stroke="#ffffff" strokeWidth="0.75" strokeOpacity="0.08" />
      <circle cx="16" cy="35" r="3.5" fill="#27a81b" fillOpacity="0.25" />
      <circle cx="16" cy="35" r="1.5" fill="#27a81b" opacity="0.9" />
      <rect x="23" y="33" width="22" height="2.5" rx="1.25" fill="#ffffff" fillOpacity="0.35" />
      <rect x="12" y="43" width="16" height="7"   rx="2"    fill="#27a81b"  fillOpacity="0.0" />
      <rect x="12" y="43" width="10" height="5.5" rx="1.25" fill="#27a81b"  opacity="0.9"  />
      <rect x="24" y="44" width="24" height="2.5" rx="1.25" fill="#ffffff"  fillOpacity="0.18" />
      <rect x="12" y="52" width="30" height="2"   rx="1"    fill="#ffffff"  fillOpacity="0.1"  />

      {/* Card 2 — Sessions */}
      <rect x="82" y="27" width="60" height="36" rx="5" fill="url(#tp-card)" stroke="#ffffff" strokeWidth="0.75" strokeOpacity="0.08" />
      <circle cx="90" cy="35" r="3.5" fill="#818cf8" fillOpacity="0.25" />
      <circle cx="90" cy="35" r="1.5" fill="#818cf8" opacity="0.9" />
      <rect x="97" y="33" width="22" height="2.5" rx="1.25" fill="#ffffff" fillOpacity="0.35" />
      <rect x="86" y="43" width="10" height="5.5" rx="1.25" fill="#818cf8" opacity="0.85" />
      <rect x="98" y="44" width="28" height="2.5" rx="1.25" fill="#ffffff" fillOpacity="0.18" />
      <rect x="86" y="52" width="24" height="2"   rx="1"    fill="#ffffff" fillOpacity="0.1"  />

      {/* Card 3 — Reports */}
      <rect x="156" y="27" width="60" height="36" rx="5" fill="url(#tp-card)" stroke="#ffffff" strokeWidth="0.75" strokeOpacity="0.08" />
      <circle cx="164" cy="35" r="3.5" fill="#10b981" fillOpacity="0.25" />
      <circle cx="164" cy="35" r="1.5" fill="#10b981" opacity="0.9" />
      <rect x="171" y="33" width="22" height="2.5" rx="1.25" fill="#ffffff" fillOpacity="0.35" />
      <rect x="160" y="43" width="10" height="5.5" rx="1.25" fill="#10b981" opacity="0.85" />
      <rect x="172" y="44" width="20" height="2.5" rx="1.25" fill="#ffffff" fillOpacity="0.18" />
      <rect x="160" y="52" width="26" height="2"   rx="1"    fill="#ffffff" fillOpacity="0.1"  />

      {/* ── Student progress panel ────────────────────────────────────────── */}
      <rect x="8" y="71" width="130" height="52" rx="5" fill="url(#tp-card)" stroke="#ffffff" strokeWidth="0.75" strokeOpacity="0.08" />
      {/* Panel title */}
      <rect x="14" y="77" width="40" height="2.5" rx="1.25" fill="#ffffff" fillOpacity="0.45" />
      <rect x="58" y="77" width="20" height="2.5" rx="1.25" fill="#ffffff" fillOpacity="0.12" />

      {/* Student rows */}
      {[
        { y: 86,  pct: 82, color: "url(#tp-track)",  w: 74 },
        { y: 97,  pct: 65, color: "url(#tp-track2)", w: 58 },
        { y: 108, pct: 91, color: "url(#tp-track3)", w: 82 },
        { y: 119, pct: 48, color: "url(#tp-track4)", w: 43 },
      ].map(({ y, color, w }, i) => (
        <g key={`row-${i}`}>
          {/* Avatar dot */}
          <circle cx="18" cy={y + 1.5} r="4" fill={["#27a81b","#a78bfa","#10b981","#f59e0b"][i]} fillOpacity="0.3" />
          <circle cx="18" cy={y + 1.5} r="2" fill={["#27a81b","#a78bfa","#10b981","#f59e0b"][i]} opacity="0.9" />
          {/* Name line */}
          <rect x="26" cy={y} y={y - 0.5} width={[20,18,22,17][i]} height="2" rx="1" fill="#ffffff" fillOpacity="0.35" />
          {/* Year tag */}
          <rect x={50 + [0,2,0,3][i]} y={y - 0.5} width="10" height="2" rx="1" fill="#ffffff" fillOpacity="0.15" />
          {/* Progress track bg */}
          <rect x="26" y={y + 4} width="90" height="2.5" rx="1.25" fill="#ffffff" fillOpacity="0.07" />
          {/* Progress fill */}
          <rect x="26" y={y + 4} width={w} height="2.5" rx="1.25" fill={color} opacity="0.85" />
        </g>
      ))}

      {/* ── Upcoming sessions panel ───────────────────────────────────────── */}
      <rect x="146" y="71" width="70" height="52" rx="5" fill="url(#tp-card)" stroke="#ffffff" strokeWidth="0.75" strokeOpacity="0.08" />
      {/* Panel title */}
      <rect x="152" y="77" width="38" height="2.5" rx="1.25" fill="#ffffff" fillOpacity="0.45" />

      {/* Session rows */}
      {[
        { y: 87,  color: "#27a81b"  },
        { y: 100, color: "#818cf8"  },
        { y: 113, color: "#10b981"  },
      ].map(({ y, color }, i) => (
        <g key={`sess-${i}`}>
          <rect x="152" y={y} width="58" height="9" rx="3"
            fill="#ffffff" fillOpacity="0.04"
            stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.07" />
          <circle cx="158" cy={y + 4.5} r="2.5" fill={color} opacity="0.25" />
          <circle cx="158" cy={y + 4.5} r="1.2" fill={color} opacity="0.9" />
          <rect x="163" y={y + 2} width={[24,20,22][i]} height="2" rx="1" fill="#ffffff" fillOpacity="0.4"  />
          <rect x="163" y={y + 5.5} width={[16,18,14][i]} height="1.5" rx="0.75" fill="#ffffff" fillOpacity="0.18" />
        </g>
      ))}
    </svg>
  );
}
