import React from 'react';

interface BeaconLogoProps {
  size?: number;
}

export default function BeaconLogo({ size = 24 }: BeaconLogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="beacon-sweet-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7fb7df" />
          <stop offset="100%" stopColor="#5897cd" />
        </linearGradient>
      </defs>
      
      {/* Simple & Sweet: Rounded Minimalist Lighthouse */}
      {/* Stable tower body */}
      <path 
        d="M8 21L10 10H14L16 21" 
        stroke="url(#beacon-sweet-grad)" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      {/* Lighthouse gallery/dome */}
      <path 
        d="M9 10C9 7.5 15 7.5 15 10" 
        stroke="url(#beacon-sweet-grad)" 
        strokeWidth="2.5" 
        strokeLinecap="round"
      />
      {/* Glowing light source */}
      <circle 
        cx="12" 
        cy="6.5" 
        r="2" 
        fill="url(#beacon-sweet-grad)" 
      />
      {/* Radiating signal wave */}
      <path 
        d="M7 6.5C7 4.5 9 2.5 12 2.5C15 2.5 17 4.5 17 6.5" 
        stroke="url(#beacon-sweet-grad)" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
    </svg>
  );
}


