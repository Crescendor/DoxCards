import React from 'react';

export default function DoxCardsLogo({ width = 320, height = 'auto', className = '', color = '#000000' }) {
  return (
    <svg
      viewBox="0 0 540 180"
      width={width}
      height={height}
      className={className}
      style={{ overflow: 'visible' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* doxcards bold lowercase text with tight kerning */}
      <text
        x="0"
        y="145"
        fontFamily="'Helvetica Neue', Helvetica, 'Arial Black', Arial, sans-serif"
        fontWeight="900"
        fontSize="148"
        fill={color}
        letterSpacing="-11"
      >
        doxcards
      </text>

      {/* Red & White Cards on top right above 's' */}
      <g transform="translate(425, -15)">
        {/* White Card (Back) */}
        <g transform="rotate(32 50 50)">
          <rect
            x="20"
            y="10"
            width="52"
            height="72"
            rx="8"
            fill="#ffffff"
            stroke="#000000"
            strokeWidth="4"
          />
        </g>
        {/* Red Card (Front) */}
        <g transform="rotate(8 40 50)">
          <rect
            x="0"
            y="15"
            width="52"
            height="72"
            rx="8"
            fill="#ef4444"
            stroke="#000000"
            strokeWidth="4"
          />
        </g>
      </g>
    </svg>
  );
}
