import React from 'react';

interface WattehLogoProps {
  size?: number;
  className?: string;
  showBg?: boolean;
}

export const WattehLogo: React.FC<WattehLogoProps> = ({ 
  size = 40, 
  className = '', 
  showBg = true 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${className}`}
    >
      {showBg && (
        <rect width="512" height="512" rx="120" fill="#0B72E7" />
      )}
      
      {/* Outer Hexagon & Converging Rays representing Watteh Logo */}
      <g stroke="#FFC400" strokeWidth="28" strokeLinecap="round" strokeLinejoin="round">
        {/* Main Hexagon Frame */}
        <path 
          d="M165 75 L347 75 L445 256 L347 437 L165 437 L67 256 Z" 
          fill="none" 
          strokeWidth="32"
        />
        
        {/* Central Converging Rays */}
        {/* Center vertical ray */}
        <path d="M256 80 L256 425" strokeWidth="28" />
        {/* Left diagonal ray */}
        <path d="M175 90 L248 420" strokeWidth="24" />
        {/* Right diagonal ray */}
        <path d="M337 90 L264 420" strokeWidth="24" />
      </g>
    </svg>
  );
};
