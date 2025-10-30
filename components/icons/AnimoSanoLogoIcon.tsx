import React from 'react';

export const AnimoSanoLogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 40 40"
    fill="none"
  >
    <circle cx="13" cy="13" r="3" fill="#35c0ed" />
    <circle cx="20" cy="20" r="3" fill="#35c0ed" />
    <circle cx="27" cy="27" r="3" fill="#35c0ed" />
    
    <circle cx="13" cy="27" r="3" fill="#9aeba6" />
    <circle cx="27" cy="13" r="3" fill="#9aeba6" />

    <path d="M13 13 L20 20 L27 27" stroke="#35c0ed" strokeWidth="1.5" />
    <path d="M13 27 L20 20 L27 13" stroke="#9aeba6" strokeWidth="1.5" />
  </svg>
);
