import React from 'react';

interface BiharEducationLogoProps {
  size?: number;
  className?: string;
  customUrl?: string;
  variant?: 'bihar_seal' | 'shiksha_vibhag' | 'ashoka_emblem';
}

export const BiharEducationLogo: React.FC<BiharEducationLogoProps> = ({
  size = 56,
  className = '',
  customUrl,
  variant = 'shiksha_vibhag'
}) => {
  if (customUrl) {
    return (
      <img
        src={customUrl}
        alt="Official Logo"
        style={{ width: `${size}px`, height: `${size}px` }}
        className={`object-contain rounded-full shadow-xs ${className}`}
      />
    );
  }

  // Official State Emblem of Bihar (Bodhi Tree with two Swastikas framed in circle)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={`shrink-0 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Golden/Navy Double Ring */}
      <circle cx="60" cy="60" r="56" fill="#ffffff" stroke="#1e293b" strokeWidth="3" />
      <circle cx="60" cy="60" r="51" fill="#f8fafc" stroke="#b45309" strokeWidth="1.5" />
      
      {/* Bihar State Government Top Arch Text */}
      <path id="curve-top" d="M 22 60 A 38 38 0 0 1 98 60" fill="none" />
      <text fontSize="7.5" fontWeight="bold" fill="#0f172a" textAnchor="middle" letterSpacing="0.5">
        <textPath href="#curve-top" startOffset="50%">
          शिक्षा विभाग • बिहार सरकार
        </textPath>
      </text>

      {/* Bodhi Tree Trunk & Roots */}
      <path
        d="M 57 88 L 60 72 L 63 88 Z"
        fill="#78350f"
        stroke="#451a03"
        strokeWidth="1"
      />
      {/* Tree Base / Pedestal */}
      <rect x="46" y="86" width="28" height="4" rx="2" fill="#1e293b" />
      <rect x="42" y="90" width="36" height="3" rx="1.5" fill="#b45309" />

      {/* Bodhi Tree Crown (Leaves clusters representing Enlightenment & Wisdom) */}
      <ellipse cx="60" cy="48" rx="18" ry="16" fill="#15803d" opacity="0.95" />
      <ellipse cx="49" cy="54" rx="13" ry="12" fill="#16a34a" />
      <ellipse cx="71" cy="54" rx="13" ry="12" fill="#16a34a" />
      <circle cx="60" cy="38" r="9" fill="#22c55e" />
      
      {/* Symbolic Sacred Beads / Leaf Details */}
      <circle cx="60" cy="32" r="3" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.8" />
      <circle cx="46" cy="42" r="2.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.8" />
      <circle cx="74" cy="42" r="2.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.8" />

      {/* Left Swastik (Traditional Bihar State Emblem detail) */}
      <g transform="translate(30, 62) scale(0.65)">
        <path
          d="M 5 0 L 5 10 L 0 10 M 5 5 L 10 5 L 10 0 M 5 5 L 5 0 L 10 0 M 5 5 L 0 5 L 0 10"
          stroke="#b45309"
          strokeWidth="2"
          fill="none"
          strokeLinecap="square"
        />
      </g>

      {/* Right Swastik */}
      <g transform="translate(78, 62) scale(0.65)">
        <path
          d="M 5 0 L 5 10 L 0 10 M 5 5 L 10 5 L 10 0 M 5 5 L 5 0 L 10 0 M 5 5 L 0 5 L 0 10"
          stroke="#b45309"
          strokeWidth="2"
          fill="none"
          strokeLinecap="square"
        />
      </g>

      {/* Bottom Arch - सत्यमेव जयते */}
      <path id="curve-bottom" d="M 24 64 A 38 38 0 0 0 96 64" fill="none" />
      <text fontSize="7" fontWeight="bold" fill="#78350f" textAnchor="middle">
        <textPath href="#curve-bottom" startOffset="50%">
          सत्यमेव जयते
        </textPath>
      </text>
    </svg>
  );
};
