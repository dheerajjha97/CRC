import React from 'react';

export type BiharLogoVariant = 'shiksha_vibhag' | 'bepc';

interface BiharEducationLogoProps {
  className?: string;
  size?: number;
  customUrl?: string;
  variant?: BiharLogoVariant;
}

export const BiharEducationLogo: React.FC<BiharEducationLogoProps> = ({
  className = '',
  size = 56,
  customUrl,
  variant = 'shiksha_vibhag'
}) => {
  if (customUrl) {
    return (
      <img
        src={customUrl}
        alt="बिहार शिक्षा विभाग लोगो"
        referrerPolicy="no-referrer"
        className={`rounded-full object-contain shrink-0 border border-slate-300 ${className}`}
        style={{ width: `${size}px`, height: `${size}px` }}
      />
    );
  }

  // Variant 1: शिक्षा विभाग, बिहार सरकार (Exact match with user's uploaded Image 6)
  if (variant === 'shiksha_vibhag') {
    return (
      <div 
        className={`inline-flex items-center justify-center shrink-0 ${className}`}
        style={{ width: `${size}px`, height: `${size}px` }}
        title="शिक्षा विभाग, बिहार सरकार (Department of Education, Govt. of Bihar)"
      >
        <svg
          viewBox="0 0 200 200"
          width={size}
          height={size}
          className="w-full h-full drop-shadow-xs"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Circular Background with Green Border & Warm Pale Yellow Canvas */}
          <circle cx="100" cy="100" r="97" fill="#fffde7" stroke="#15803d" strokeWidth="4" />
          <circle cx="100" cy="100" r="93" fill="none" stroke="#86efac" strokeWidth="0.8" />

          {/* Top-Left Green Leaf Sprig */}
          <g fill="#16a34a" stroke="#15803d" strokeWidth="0.8">
            <path d="M 32 68 Q 45 45 60 30" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 44 32 Q 54 28 58 35 Q 52 42 44 32 Z" />
            <path d="M 33 46 Q 44 42 47 50 Q 40 56 33 46 Z" />
            <path d="M 28 65 Q 38 60 41 68 Q 33 73 28 65 Z" />
          </g>

          {/* Top-Right Green Leaf Sprig */}
          <g fill="#16a34a" stroke="#15803d" strokeWidth="0.8">
            <path d="M 168 68 Q 155 45 140 30" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 156 32 Q 146 28 142 35 Q 148 42 156 32 Z" />
            <path d="M 167 46 Q 156 42 153 50 Q 160 56 167 46 Z" />
            <path d="M 172 65 Q 162 60 159 68 Q 167 73 172 65 Z" />
          </g>

          {/* Left Pencil (Curved decorative pencil) */}
          <g transform="translate(18, 72) rotate(10)">
            <path d="M 5 0 Q 3 25 7 48 L 16 46 Q 12 25 14 0 Z" fill="#fde047" stroke="#334155" strokeWidth="1.2" />
            <path d="M 7 14 L 14 13" stroke="#eab308" strokeWidth="1.5" />
            <path d="M 6 48 L 11 58 L 16 46 Z" fill="#fbcfe8" stroke="#334155" strokeWidth="1" />
            <polygon points="10,54 11,58 12,54" fill="#0f172a" />
            <rect x="5" y="-3" width="9" height="4" rx="1" fill="#f43f5e" stroke="#334155" strokeWidth="0.8" />
          </g>

          {/* Right Pencil (Curved decorative pencil) */}
          <g transform="translate(168, 72) rotate(-10)">
            <path d="M 5 0 Q 7 25 3 48 L 12 46 Q 16 25 14 0 Z" fill="#fde047" stroke="#334155" strokeWidth="1.2" />
            <path d="M 6 14 L 13 13" stroke="#eab308" strokeWidth="1.5" />
            <path d="M 3 48 L 8 58 L 12 46 Z" fill="#fbcfe8" stroke="#334155" strokeWidth="1" />
            <polygon points="7,54 8,58 9,54" fill="#0f172a" />
            <rect x="4" y="-3" width="9" height="4" rx="1" fill="#f43f5e" stroke="#334155" strokeWidth="0.8" />
          </g>

          {/* Center Official Bihar Bodhi Tree Emblem */}
          <g transform="translate(100, 36) scale(0.85)" textAnchor="middle">
            {/* Trunk */}
            <path d="M -3 36 L -3 10 Q 0 8 3 10 L 3 36 Z" fill="#ffffff" stroke="#0f172a" strokeWidth="1.8" />
            
            {/* Main Tree Leaves (Peepal / Bodhi Tree Leaves) */}
            <g fill="#ffffff" stroke="#0f172a" strokeWidth="1.5">
              {/* Central vertical leaf branch */}
              <ellipse cx="0" cy="-6" rx="5" ry="9" />
              <ellipse cx="-7" cy="1" rx="5" ry="8" transform="rotate(-20 -7 1)" />
              <ellipse cx="7" cy="1" rx="5" ry="8" transform="rotate(20 7 1)" />
              
              <ellipse cx="-13" cy="9" rx="4.5" ry="7.5" transform="rotate(-35 -13 9)" />
              <ellipse cx="13" cy="9" rx="4.5" ry="7.5" transform="rotate(35 13 9)" />
              
              <ellipse cx="-17" cy="19" rx="4.5" ry="7" transform="rotate(-50 -17 19)" />
              <ellipse cx="17" cy="19" rx="4.5" ry="7" transform="rotate(50 17 19)" />

              <ellipse cx="-6" cy="16" rx="4.5" ry="7.5" transform="rotate(-15 -6 16)" />
              <ellipse cx="6" cy="16" rx="4.5" ry="7.5" transform="rotate(15 6 16)" />

              <ellipse cx="-12" cy="27" rx="4" ry="6.5" transform="rotate(-40 -12 27)" />
              <ellipse cx="12" cy="27" rx="4" ry="6.5" transform="rotate(40 12 27)" />
            </g>

            {/* Prayer Beads / Mala hanging from branches */}
            <path d="M -8 26 Q -12 36 -6 44 Q 0 36 -4 26" fill="none" stroke="#0f172a" strokeWidth="1.4" strokeDasharray="2,2" />
            <path d="M 8 26 Q 12 36 6 44 Q 0 36 4 26" fill="none" stroke="#0f172a" strokeWidth="1.4" strokeDasharray="2,2" />

            {/* Left Swastika (卐) */}
            <g transform="translate(-25, 28) scale(0.6)" stroke="#0f172a" strokeWidth="2.8" fill="none" strokeLinecap="square">
              <rect x="-3" y="-3" width="22" height="22" stroke="#0f172a" strokeWidth="1.5" />
              <line x1="0" y1="8" x2="16" y2="8" />
              <line x1="8" y1="0" x2="8" y2="16" />
              <line x1="16" y1="8" x2="16" y2="0" />
              <line x1="0" y1="8" x2="0" y2="16" />
              <line x1="8" y1="0" x2="0" y2="0" />
              <line x1="8" y1="16" x2="16" y2="16" />
            </g>

            {/* Right Swastika (卐) */}
            <g transform="translate(13, 28) scale(0.6)" stroke="#0f172a" strokeWidth="2.8" fill="none" strokeLinecap="square">
              <rect x="-3" y="-3" width="22" height="22" stroke="#0f172a" strokeWidth="1.5" />
              <line x1="0" y1="8" x2="16" y2="8" />
              <line x1="8" y1="0" x2="8" y2="16" />
              <line x1="16" y1="8" x2="16" y2="0" />
              <line x1="0" y1="8" x2="0" y2="16" />
              <line x1="8" y1="0" x2="0" y2="0" />
              <line x1="8" y1="16" x2="16" y2="16" />
            </g>

            {/* Pedestal Altar Base Box */}
            <g transform="translate(0, 46)">
              <rect x="-14" y="-8" width="28" height="15" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
              <rect x="-11" y="-5" width="22" height="9" fill="none" stroke="#0f172a" strokeWidth="1" />
              <line x1="-8" y1="-2" x2="8" y2="-2" stroke="#0f172a" strokeWidth="1" />
              <line x1="-5" y1="-5" x2="-5" y2="4" stroke="#0f172a" strokeWidth="1" />
              <line x1="0" y1="-5" x2="0" y2="4" stroke="#0f172a" strokeWidth="1" />
              <line x1="5" y1="-5" x2="5" y2="4" stroke="#0f172a" strokeWidth="1" />
            </g>
          </g>

          {/* Main Typography: "शिक्षा विभाग" & "बिहार सरकार" */}
          <text 
            x="100" 
            y="126" 
            fontSize="21" 
            fontWeight="bold" 
            fill="#047857" 
            textAnchor="middle" 
            fontFamily="'Tiro Devanagari Hindi', 'Noto Sans Devanagari', 'Kruti Dev', sans-serif"
            letterSpacing="0.4"
          >
            शिक्षा विभाग
          </text>
          
          <text 
            x="100" 
            y="146" 
            fontSize="14.5" 
            fontWeight="bold" 
            fill="#065f46" 
            textAnchor="middle" 
            fontFamily="'Tiro Devanagari Hindi', 'Noto Sans Devanagari', sans-serif"
            letterSpacing="0.6"
          >
            बिहार सरकार
          </text>

          {/* Bottom Open Book Illustration */}
          <g transform="translate(100, 168) scale(0.85)">
            {/* Left Page */}
            <path 
              d="M 0 0 Q -24 -8 -44 2 L -44 18 Q -24 8 0 16 Z" 
              fill="#ffffff" 
              stroke="#047857" 
              strokeWidth="1.8" 
            />
            {/* Right Page */}
            <path 
              d="M 0 0 Q 24 -8 44 2 L 44 18 Q 24 8 0 16 Z" 
              fill="#ffffff" 
              stroke="#047857" 
              strokeWidth="1.8" 
            />
            {/* Spine Center */}
            <line x1="0" y1="0" x2="0" y2="16" stroke="#047857" strokeWidth="2" />
            {/* Left Page Text Lines */}
            <line x1="-36" y1="5" x2="-8" y2="2" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="-36" y1="9" x2="-8" y2="6" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="-36" y1="13" x2="-12" y2="10" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
            {/* Right Page Text Lines */}
            <line x1="8" y1="2" x2="36" y2="5" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="8" y1="6" x2="36" y2="9" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="12" y1="10" x2="36" y2="13" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
          </g>

          {/* Bottom Left Leaf Sprig */}
          <g fill="#16a34a" stroke="#15803d" strokeWidth="0.8">
            <path d="M 36 142 Q 44 158 58 168" fill="none" stroke="#15803d" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M 33 148 Q 42 144 44 152 Q 37 156 33 148 Z" />
            <path d="M 45 160 Q 54 156 56 164 Q 48 168 45 160 Z" />
          </g>

          {/* Bottom Right Leaf Sprig */}
          <g fill="#16a34a" stroke="#15803d" strokeWidth="0.8">
            <path d="M 164 142 Q 156 158 142 168" fill="none" stroke="#15803d" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M 167 148 Q 158 144 156 152 Q 163 156 167 148 Z" />
            <path d="M 155 160 Q 146 156 144 164 Q 152 168 155 160 Z" />
          </g>
        </svg>
      </div>
    );
  }

  // Variant 2: बिहार शिक्षा परियोजना परिषद (BEPC) Logo (User's uploaded Image 5)
  return (
    <div 
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      title="बिहार शिक्षा परियोजना परिषद (Bihar Education Project Council)"
    >
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        className="w-full h-full drop-shadow-xs"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Deep Indigo/Purple Outer Circle */}
        <circle cx="100" cy="100" r="97" fill="#2e1065" stroke="#ffffff" strokeWidth="3" />
        <circle cx="100" cy="100" r="94" fill="#3b0764" stroke="#e0e7ff" strokeWidth="1.5" />

        {/* Inner Circle Border */}
        <circle cx="100" cy="100" r="70" fill="#581c87" stroke="#ffffff" strokeWidth="1.8" />

        {/* Circular Curved Paths for Text */}
        <path id="bepcTopCurve" d="M 28 100 A 72 72 0 0 1 172 100" fill="none" />
        <path id="bepcBottomCurve" d="M 172 100 A 72 72 0 0 1 28 100" fill="none" />

        {/* Top Text: बिहार शिक्षा परियोजना */}
        <text fontSize="14" fontWeight="bold" fill="#ffffff" textAnchor="middle" letterSpacing="1">
          <textPath href="#bepcTopCurve" startOffset="50%">
            बिहार शिक्षा परियोजना
          </textPath>
        </text>

        {/* Bottom Text: BIHAR EDUCATION PROJECT */}
        <text fontSize="11" fontWeight="bold" fill="#ffffff" textAnchor="middle" letterSpacing="0.8">
          <textPath href="#bepcBottomCurve" startOffset="50%">
            BIHAR EDUCATION PROJECT
          </textPath>
        </text>

        {/* Left and Right Gold Rivets */}
        <circle cx="26" cy="106" r="4.5" fill="#fbbf24" stroke="#78350f" strokeWidth="1" />
        <circle cx="174" cy="106" r="4.5" fill="#fbbf24" stroke="#78350f" strokeWidth="1" />

        {/* Bihar Map Silhouette (Yellow Center) */}
        <g transform="translate(100, 108) scale(0.72)">
          <path
            d="M -56 -18 L -38 -28 L -10 -22 L 20 -28 L 52 -16 L 62 10 L 48 28 L 22 22 L -12 30 L -46 22 L -58 0 Z"
            fill="#fef08a"
            stroke="#ca8a04"
            strokeWidth="1.5"
          />
          {/* District grid lines inside map */}
          <path
            d="M -30 -24 L -15 15 M 10 -25 L 5 22 M -40 0 L 45 5 M -15 -10 L 30 -5"
            stroke="#eab308"
            strokeWidth="0.8"
            fill="none"
          />
        </g>

        {/* Open Book on Lamp/Stand in Center */}
        <g transform="translate(100, 72) scale(0.65)">
          {/* Stand */}
          <path d="M 0 12 L 0 24 L -8 30 L 8 30 L 0 24" fill="#0f172a" />
          <circle cx="0" cy="20" r="4" fill="#cbd5e1" stroke="#0f172a" strokeWidth="1.2" />

          {/* Open Book */}
          <path d="M 0 0 Q -18 -8 -34 0 L -34 22 Q -18 14 0 20 Z" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
          <path d="M 0 0 Q 18 -8 34 0 L 34 22 Q 18 14 0 20 Z" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
          <line x1="0" y1="0" x2="0" y2="20" stroke="#0f172a" strokeWidth="2" />
          {/* Book lines */}
          <line x1="-28" y1="6" x2="-6" y2="3" stroke="#475569" strokeWidth="1.2" />
          <line x1="-28" y1="11" x2="-6" y2="8" stroke="#475569" strokeWidth="1.2" />
          <line x1="-28" y1="16" x2="-6" y2="13" stroke="#475569" strokeWidth="1.2" />
          <line x1="6" y1="3" x2="28" y2="6" stroke="#475569" strokeWidth="1.2" />
          <line x1="6" y1="8" x2="28" y2="11" stroke="#475569" strokeWidth="1.2" />
          <line x1="6" y1="13" x2="28" y2="16" stroke="#475569" strokeWidth="1.2" />
        </g>

        {/* Chain of Children (Red Holding Hands Motif) */}
        <g transform="translate(100, 118) scale(0.85)">
          {/* Children Silhouette Chain */}
          <path
            d="M -54 0 Q -45 -12 -38 0 Q -30 -14 -20 0 Q -10 -15 0 0 Q 10 -15 20 0 Q 30 -14 38 0 Q 45 -12 54 0 L 48 18 L -48 18 Z"
            fill="#b91c1c"
            stroke="#ffffff"
            strokeWidth="1.2"
          />
          {/* Heads of Children */}
          <circle cx="-46" cy="-8" r="4.5" fill="#dc2626" stroke="#ffffff" strokeWidth="0.8" />
          <circle cx="-29" cy="-10" r="4.5" fill="#dc2626" stroke="#ffffff" strokeWidth="0.8" />
          <circle cx="-10" cy="-11" r="4.5" fill="#dc2626" stroke="#ffffff" strokeWidth="0.8" />
          <circle cx="10" cy="-11" r="4.5" fill="#dc2626" stroke="#ffffff" strokeWidth="0.8" />
          <circle cx="29" cy="-10" r="4.5" fill="#dc2626" stroke="#ffffff" strokeWidth="0.8" />
          <circle cx="46" cy="-8" r="4.5" fill="#dc2626" stroke="#ffffff" strokeWidth="0.8" />
        </g>
      </svg>
    </div>
  );
};
