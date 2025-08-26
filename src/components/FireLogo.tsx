
import React from "react";

const FireLogo = ({ size = 32, className = "" }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-label="聚火盆Logo"
  >
    <g>
      <path
        d="M24 5c0 10 8 11 7 19-1 8-11 7-11-2 0-4 1-7-2-13C13 15 7 23 7 30c0 9 7.3 13 17 13s17-4 17-13C41 19 28 14 24 5z"
        fill="url(#fire-gradient)"
      />
      <path
        d="M21 34a3 3 0 1 0 6 0"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <ellipse
        cx="24"
        cy="40"
        rx="12"
        ry="5"
        fill="#FFEDD5"
        fillOpacity="0.8"
      />
    </g>
    <defs>
      <linearGradient id="fire-gradient" x1="18" y1="9" x2="37" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF9000"/>
        <stop offset="0.5" stopColor="#FDBA34"/>
        <stop offset="1" stopColor="#EA580C"/>
      </linearGradient>
    </defs>
  </svg>
);

export default FireLogo;
