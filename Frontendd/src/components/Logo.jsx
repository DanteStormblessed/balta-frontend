import React from 'react'

export default function Logo({ size = 36 }) {
  return (
    <div className="logo" style={{ width: size, height: size }} aria-label="logo">
      <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-hidden="true">
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#70452a"/>
            <stop offset="100%" stopColor="#3e2416"/>
          </linearGradient>
        </defs>
        <path fill="url(#lg)" d="M12 20c0-6 6-12 12-12h16c6 0 12 6 12 12v28c0 4-4 8-8 8H20c-4 0-8-4-8-8V20z"/>
        <path fill="#2b1810" d="M20 18h24v6H20z"/>
        <circle cx="32" cy="32" r="6" fill="#c08a5b"/>
      </svg>
    </div>
  )
}
