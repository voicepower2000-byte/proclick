import React from 'react';

interface ProClickLogoProps {
  className?: string;
  size?: number;
}

export const ProClickLogo: React.FC<ProClickLogoProps> = ({ className = 'w-7 h-7', size = 28 }) => {
  // Center is (100, 100)
  // Palette matching the reference image:
  const blue = '#00A3FF';
  const white = '#FFFFFF';

  // Unique ID prefix to avoid any SVG mask ID collision if mounted multiple times
  const maskId = 'pro-click-hand-cutout-mask';
  const glowId = 'pro-click-pulse-glow';

  // Helper to convert polar coordinates to SVG arc path
  const polarToCartesian = (cx: number, cy: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
    return {
      x: cx + radius * Math.cos(angleInRadians),
      y: cy + radius * Math.sin(angleInRadians),
    };
  };

  const createArc = (
    cx: number,
    cy: number,
    radius: number,
    startAngle: number,
    endAngle: number
  ) => {
    const start = polarToCartesian(cx, cy, radius, startAngle);
    const end = polarToCartesian(cx, cy, radius, endAngle);
    let angleDiff = endAngle - startAngle;
    if (angleDiff < 0) angleDiff += 360;
    const largeArcFlag = angleDiff > 180 ? 1 : 0;
    return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
  };

  const rOuter = 78;
  const strokeOuter = 13.5;
  const rInner = 58;
  const strokeInner = 11.5;

  // Exact path describing the hand's silhouette
  const handSilhouettePath = `
    M 97 106 
    L 102 82 
    C 103.5 76.5, 109.5 76.5, 111 82 
    L 115 97 
    L 122 93 
    C 126 91, 130 95, 128.5 99 
    L 133 100 
    C 137.5 101, 138.5 106.5, 136 110 
    L 142 112 
    C 146.5 114, 146 122, 141 126 
    L 137 138 
    L 126 162 
    L 106 148 
    L 94 133 
    C 89 125, 88 116, 94 110 
    C 97.5 107.5, 101 110, 102 113 
    L 97 106 
    Z
  `;

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`select-none shrink-0 inline-block align-middle ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Pro Click Logo"
    >
      <defs>
        {/* Subtle cyan glow for the center click target */}
        <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#00A3FF" floodOpacity="0.6" />
        </filter>

        {/* Dynamic Alpha Mask: Masks out the circular rings where the hand passes over */}
        <mask id={maskId}>
          {/* Default visible canvas */}
          <rect x="0" y="0" width="200" height="200" fill="#FFFFFF" />
          {/* Transparent cutout silhouette behind the hand with protective border */}
          <path
            d={handSilhouettePath}
            fill="#000000"
            stroke="#000000"
            strokeWidth="11"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </mask>
      </defs>

      {/* Group masked by the hand cutout mask so background is 100% transparent */}
      <g mask={`url(#${maskId})`}>
        {/* ========================================================
            1. OUTER SEGMENTED RING (r = 78, stroke = 13.5)
            ======================================================== */}
        {/* Top right quadrant: Blue segment 1 (272° to 326°) */}
        <path
          d={createArc(100, 100, rOuter, 272, 326)}
          stroke={blue}
          strokeWidth={strokeOuter}
          strokeLinecap="butt"
        />

        {/* Top right quadrant: Blue segment 2 (330° to 18°) */}
        <path
          d={createArc(100, 100, rOuter, 330, 18)}
          stroke={blue}
          strokeWidth={strokeOuter}
          strokeLinecap="butt"
        />

        {/* Right side: Blue segment 3 (22° to 56°) */}
        <path
          d={createArc(100, 100, rOuter, 22, 56)}
          stroke={blue}
          strokeWidth={strokeOuter}
          strokeLinecap="butt"
        />

        {/* Bottom right: Blue segment 4 (60° to 88°) */}
        <path
          d={createArc(100, 100, rOuter, 60, 88)}
          stroke={blue}
          strokeWidth={strokeOuter}
          strokeLinecap="butt"
        />

        {/* Bottom left quadrant: White segment (92° to 124°) */}
        <path
          d={createArc(100, 100, rOuter, 92, 124)}
          stroke={white}
          strokeWidth={strokeOuter}
          strokeLinecap="butt"
        />

        {/* Bottom left quadrant: Blue segment 5 (128° to 150°) */}
        <path
          d={createArc(100, 100, rOuter, 128, 150)}
          stroke={blue}
          strokeWidth={strokeOuter}
          strokeLinecap="butt"
        />

        {/* Mid left: Blue segment 6 (154° to 176°) */}
        <path
          d={createArc(100, 100, rOuter, 154, 176)}
          stroke={blue}
          strokeWidth={strokeOuter}
          strokeLinecap="butt"
        />

        {/* Mid-upper left: White segment 1 (182° to 204°) */}
        <path
          d={createArc(100, 100, rOuter, 182, 204)}
          stroke={white}
          strokeWidth={strokeOuter}
          strokeLinecap="butt"
        />

        {/* Upper left: White segment 2 (208° to 226°) */}
        <path
          d={createArc(100, 100, rOuter, 208, 226)}
          stroke={white}
          strokeWidth={strokeOuter}
          strokeLinecap="butt"
        />

        {/* Upper left: White segment 3 (230° to 248°) */}
        <path
          d={createArc(100, 100, rOuter, 230, 248)}
          stroke={white}
          strokeWidth={strokeOuter}
          strokeLinecap="butt"
        />

        {/* Top left before 12 o'clock: White segment 4 (252° to 268°) */}
        <path
          d={createArc(100, 100, rOuter, 252, 268)}
          stroke={white}
          strokeWidth={strokeOuter}
          strokeLinecap="butt"
        />

        {/* ========================================================
            2. INNER SEGMENTED RING (r = 58, stroke = 11.5)
            ======================================================== */}
        {/* Top right inner: White arc (272° to 345°) */}
        <path
          d={createArc(100, 100, rInner, 272, 345)}
          stroke={white}
          strokeWidth={strokeInner}
          strokeLinecap="butt"
        />

        {/* Right inner: White continuation (349° to 22°) */}
        <path
          d={createArc(100, 100, rInner, 349, 22)}
          stroke={white}
          strokeWidth={strokeInner}
          strokeLinecap="butt"
        />

        {/* Lower right inner: Blue segment (26° to 60°) */}
        <path
          d={createArc(100, 100, rInner, 26, 60)}
          stroke={blue}
          strokeWidth={strokeInner}
          strokeLinecap="butt"
        />

        {/* Left side: 4 distinct cyan-blue blocks along the inner ring */}
        <path
          d={createArc(100, 100, rInner, 128, 150)}
          stroke={blue}
          strokeWidth={strokeInner}
          strokeLinecap="butt"
        />
        <path
          d={createArc(100, 100, rInner, 154, 176)}
          stroke={blue}
          strokeWidth={strokeInner}
          strokeLinecap="butt"
        />
        <path
          d={createArc(100, 100, rInner, 182, 204)}
          stroke={blue}
          strokeWidth={strokeInner}
          strokeLinecap="butt"
        />
        <path
          d={createArc(100, 100, rInner, 208, 226)}
          stroke={blue}
          strokeWidth={strokeInner}
          strokeLinecap="butt"
        />

        {/* Top left inner: White block (232° to 268°) */}
        <path
          d={createArc(100, 100, rInner, 232, 268)}
          stroke={white}
          strokeWidth={strokeInner}
          strokeLinecap="butt"
        />
      </g>

      {/* ========================================================
          3. CENTER CLICK TARGET (Cyan Arc centered at 100, 100)
          ======================================================== */}
      <path
        d={createArc(100, 100, 19, 175, 25)}
        stroke={blue}
        strokeWidth="6"
        strokeLinecap="round"
        filter={`url(#${glowId})`}
      />

      {/* ========================================================
          4. CENTRAL HAND CURSOR (Pure White Contour & Lines)
          ======================================================== */}
      {/* Hand Body Base Mask (solid dark to hide any stray pixels) */}
      <path
        d={handSilhouettePath}
        fill="#000000"
      />

      {/* Hand Outlines & Fingers */}
      {/* 1. Extended Index Finger pointing to center arc */}
      <path
        d="M 97 106
           L 102 82
           C 103.5 76.5, 109.5 76.5, 111 82
           L 115 106"
        stroke={white}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 2. Folded Middle Finger */}
      <path
        d="M 115 99
           C 116 93.5, 123 93.5, 124 99
           L 124 111"
        stroke={white}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 3. Folded Ring Finger */}
      <path
        d="M 124 105
           C 125 100, 132 100, 133 105
           L 133 117"
        stroke={white}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 4. Folded Pinky Finger & Outer Hand Edge */}
      <path
        d="M 133 111
           C 134 106, 141 106, 142 111
           L 142 125
           C 142 133, 138 143, 128 158"
        stroke={white}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 5. Curved Thumb */}
      <path
        d="M 97 106
           C 92 106, 87 112, 90 120
           C 92 125, 97 127, 104 125
           L 107 124"
        stroke={white}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 6. Palm / Wrist base */}
      <path
        d="M 104 133
           C 107 139, 113 147, 121 153"
        stroke={white}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};


