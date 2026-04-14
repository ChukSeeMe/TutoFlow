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


// ── Tutor: Planning Scene ────────────────────────────────────────────────────

export function TutorPlanningScene({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 224 130"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="tp-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#0d0726" />
          <stop offset="100%" stopColor="#120a30" />
        </linearGradient>
        <radialGradient id="tp-glow" cx="35%" cy="65%" r="55%">
          <stop offset="0%"   stopColor="#1c660c" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#1c660c" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="tp-glow2" cx="75%" cy="35%" r="45%">
          <stop offset="0%"   stopColor="#27a81b" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#27a81b" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="tp-amber" cx="50%" cy="80%" r="40%">
          <stop offset="0%"   stopColor="#f59e0b" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Background */}
      <rect width="224" height="130" fill="url(#tp-bg)" />
      <ellipse cx="80"  cy="85"  rx="110" ry="80"  fill="url(#tp-glow)"  />
      <ellipse cx="168" cy="45"  rx="90"  ry="70"  fill="url(#tp-glow2)" />
      <ellipse cx="112" cy="110" rx="80"  ry="50"  fill="url(#tp-amber)" />

      {/* Desk surface */}
      <rect x="0" y="96" width="224" height="34" fill="#0a0820" />
      <rect x="0" y="94" width="224" height="4"  fill="#150f35" />

      {/* ── Book stack (left) ──────────────────────────────────────────── */}
      <rect x="8"  y="82" width="34" height="7"  rx="1.5" fill="#27a81b" />
      <rect x="8"  y="74" width="30" height="8"  rx="1.5" fill="#1c660c" />
      <rect x="10" y="66" width="27" height="8"  rx="1.5" fill="#155209" />
      <rect x="8"  y="82" width="3.5" height="7" rx="1"   fill="#3ec436" />
      <rect x="8"  y="74" width="3"   height="8" rx="1"   fill="#1c660c" />

      {/* ── Laptop/screen (center) ─────────────────────────────────────── */}
      <rect x="62" y="52" width="80" height="50" rx="5" fill="#090d1a" stroke="#1a2745" strokeWidth="1.5" />
      {/* Screen content */}
      <rect x="68" y="58" width="40" height="2.5" rx="1" fill="#1c660c" opacity="0.8" />
      <rect x="68" y="64" width="55" height="2"   rx="1" fill="#818cf8" opacity="0.5" />
      <rect x="68" y="70" width="30" height="2"   rx="1" fill="#38bdf8" opacity="0.6" />
      <rect x="68" y="76" width="48" height="2"   rx="1" fill="#818cf8" opacity="0.55" />
      <rect x="68" y="82" width="35" height="2"   rx="1" fill="#1c660c" opacity="0.5" />
      <rect x="68" y="88" width="52" height="2"   rx="1" fill="#818cf8" opacity="0.45" />
      {/* Screen top glow */}
      <rect x="62" y="52" width="80" height="5" rx="5" fill="#1c660c" opacity="0.08" />
      {/* Laptop base */}
      <rect x="58" y="102" width="88" height="5" rx="2.5" fill="#10103a" />

      {/* ── Coffee mug (right of laptop) ──────────────────────────────── */}
      <rect x="150" y="85"  width="14" height="12" rx="3" fill="#14122e" />
      <rect x="150" y="85"  width="14" height="3"  rx="2" fill="#201c50" />
      <path d="M164 88 Q170 88 170 92 Q170 96 164 96" stroke="#14122e" strokeWidth="2" fill="none" />
      {/* Steam */}
      <path d="M154 83 Q155 78 154 73" stroke="#1c660c" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.5" />
      <path d="M158 82 Q159 77 158 72" stroke="#1c660c" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.35" />

      {/* ── Tutor figure (left-center) ─────────────────────────────────── */}
      <ellipse cx="45" cy="63" rx="13" ry="14" fill="#0f0d28" />
      <ellipse cx="45" cy="52" rx="13" ry="6"  fill="#1a1845" />
      <rect x="40" y="75"  width="10" height="7"  rx="3" fill="#0f0d28" />
      <rect x="28" y="80"  width="34" height="22" rx="8" fill="#0c0a20" />
      <rect x="54" y="86"  width="38" height="8"  rx="4" fill="#0c0a20" />

      {/* ── Floating brain/AI icon (top-right) ────────────────────────── */}
      <circle cx="194" cy="30" r="18" fill="#1c660c" fillOpacity="0.1" stroke="#1c660c" strokeWidth="1.5" strokeOpacity="0.4" />
      {/* Simplified brain shape */}
      <path d="M187 28 Q185 22 190 20 Q194 18 196 22 Q200 18 204 22 Q208 24 206 29 Q208 34 204 36 Q200 38 196 36 Q192 38 188 35 Q185 32 187 28Z"
        fill="none" stroke="#a5b4fc" strokeWidth="1.5" strokeLinejoin="round" opacity="0.8" />
      <path d="M196 22 L196 36" stroke="#a5b4fc" strokeWidth="1" opacity="0.5" />
      <path d="M191 25 Q194 27 191 30" stroke="#a5b4fc" strokeWidth="1" fill="none" opacity="0.5" />
      <path d="M201 25 Q198 27 201 30" stroke="#a5b4fc" strokeWidth="1" fill="none" opacity="0.5" />

      {/* Sparkle dots */}
      {[[20,15],[40,10],[160,12],[210,55],[205,80],[15,95]].map(([x,y],i) => (
        <circle key={`sp${i}`} cx={x} cy={y} r="1" fill="white" opacity={0.2 + i*0.04} />
      ))}
    </svg>
  );
}
