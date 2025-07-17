import React from "react";

// OpenAI SVG (official knot logo, white on black, no outline)
const OpenAILogo = () => (
  <svg viewBox="0 0 40 40" width={28} height={28} fill="none">
    <circle cx="20" cy="20" r="20" fill="#111" />
    <g transform="translate(7,7)">
      <path d="M13 0.5c-1.6 0-3.1 0.4-4.4 1.2l-4.5 2.6C2.1 5.2 1 7.1 1 9.2v5.2c0 2.1 1.1 4 3 5.2l4.5 2.6c1.3 0.8 2.8 1.2 4.4 1.2s3.1-0.4 4.4-1.2l4.5-2.6c1.9-1.1 3-3.1 3-5.2v-5.2c0-2.1-1.1-4-3-5.2l-4.5-2.6C16.1 0.9 14.6 0.5 13 0.5zm0 2c1.2 0 2.3 0.3 3.3 0.9l4.5 2.6c1.4 0.8 2.2 2.3 2.2 3.9v5.2c0 1.6-0.8 3.1-2.2 3.9l-4.5 2.6c-1 0.6-2.1 0.9-3.3 0.9s-2.3-0.3-3.3-0.9l-4.5-2.6C2.8 16.1 2 14.6 2 13V7.8c0-1.6 0.8-3.1 2.2-3.9l4.5-2.6C10.7 2.8 11.8 2.5 13 2.5zm0 3c-2.5 0-4.5 2-4.5 4.5S10.5 14.5 13 14.5 17.5 12.5 17.5 10 15.5 5.5 13 5.5zm0 2c1.4 0 2.5 1.1 2.5 2.5S14.4 12.5 13 12.5 10.5 11.4 10.5 10 11.6 7.5 13 7.5z" fill="#fff"/>
    </g>
  </svg>
);

// Claude SVG (realistic starburst)
const ClaudeLogo = () => (
  <svg viewBox="0 0 40 40" width={28} height={28} fill="none">
    <circle cx="20" cy="20" r="20" fill="#23272a" />
    <g transform="translate(20,20)">
      <g stroke="#E16A3D" strokeWidth="2" strokeLinecap="round">
        <line x1="0" y1="-10" x2="0" y2="-4" />
        <line x1="0" y1="10" x2="0" y2="4" />
        <line x1="-10" y1="0" x2="-4" y2="0" />
        <line x1="10" y1="0" x2="4" y2="0" />
        <line x1="-7" y1="-7" x2="-3" y2="-3" />
        <line x1="7" y1="7" x2="3" y2="3" />
        <line x1="-7" y1="7" x2="-3" y2="3" />
        <line x1="7" y1="-7" x2="3" y2="-3" />
        <line x1="-9" y1="-3" x2="-4" y2="-1" />
        <line x1="9" y1="3" x2="4" y2="1" />
        <line x1="-9" y1="3" x2="-4" y2="1" />
        <line x1="9" y1="-3" x2="4" y2="-1" />
      </g>
    </g>
  </svg>
);

// Twitter SVG (neutralized)
const TwitterLogo = () => (
  <svg viewBox="0 0 40 40" width={28} height={28} fill="none">
    <circle cx="20" cy="20" r="20" fill="#23272a" />
    <path d="M30 15.5c-.7.3-1.4.5-2.1.6.8-.5 1.3-1.2 1.6-2-.7.4-1.5.7-2.3.9a3.5 3.5 0 0 0-6 3.2c-2.9-.1-5.5-1.5-7.2-3.7-.3.5-.5 1.2-.5 1.8 0 1.2.6 2.3 1.6 2.9-.6 0-1.1-.2-1.6-.4v.1c0 1.7 1.2 3.1 2.8 3.4-.3.1-.6.2-.9.2-.2 0-.4 0-.6-.1.4 1.3 1.6 2.2 3 2.2A7 7 0 0 1 10 27.1c-.5 0-1 0-1.5-.1A10 10 0 0 0 17 29c6.3 0 9.7-5.2 9.7-9.7v-.4c.7-.5 1.3-1.2 1.8-1.9z" fill="#e5e7eb"/>
  </svg>
);

// GitHub SVG (neutralized)
const GitHubLogo = () => (
  <svg viewBox="0 0 40 40" width={28} height={28} fill="none">
    <circle cx="20" cy="20" r="20" fill="#23272a" />
    <path d="M20 12c-4.4 0-8 3.6-8 8 0 3.5 2.3 6.4 5.5 7.5.4.1.5-.2.5-.4v-1.4c-2.2.5-2.7-1-2.7-1-.4-1-1-1.3-1-1.3-.8-.6.1-.6.1-.6.9.1 1.4.9 1.4.9.8 1.4 2.1 1 2.6.8.1-.6.3-1 .5-1.2-1.8-.2-3.7-.9-3.7-4 0-.9.3-1.6.8-2.2-.1-.2-.3-1 .1-2.1 0 0 .7-.2 2.2.8.7-.2 1.5-.3 2.2-.3.7 0 1.5.1 2.2.3 1.5-1 2.2-.8 2.2-.8.4 1.1.2 1.9.1 2.1.5.6.8 1.3.8 2.2 0 3.1-1.9 3.8-3.7 4 .3.3.5.7.5 1.4v2c0 .2.1.5.5.4A8 8 0 0 0 28 20c0-4.4-3.6-8-8-8z" fill="#e5e7eb"/>
  </svg>
);

// LinkedIn SVG (neutralized)
const LinkedInLogo = () => (
  <svg viewBox="0 0 40 40" width={28} height={28} fill="none">
    <circle cx="20" cy="20" r="20" fill="#23272a" />
    <rect x="12" y="16" width="4" height="12" fill="#e5e7eb" />
    <rect x="18" y="20" width="4" height="8" fill="#e5e7eb" />
    <circle cx="14" cy="13" r="2" fill="#e5e7eb" />
    <rect x="24" y="20" width="4" height="8" fill="#e5e7eb" />
  </svg>
);

const items = [
  { label: "OpenAI", icon: <OpenAILogo /> },
  { label: "Claude", icon: <ClaudeLogo /> },
  { label: "Twitter", icon: <TwitterLogo /> },
  { label: "GitHub", icon: <GitHubLogo /> },
  { label: "LinkedIn", icon: <LinkedInLogo /> },
  { label: "Pixelpath" },
  { label: "CodeLine" },
  { label: "Digitech" },
  { label: "Netdot" },
  { label: "Sparkweb" },
];

export default function Marquee() {
  return (
    <div className="overflow-hidden w-full bg-transparent py-4">
      <div className="flex animate-marquee whitespace-nowrap">
        {items.concat(items).map((item, idx) => (
          <div
            key={idx}
            className="mx-4 px-6 py-2 rounded-full bg-gradient-to-b from-neutral-900 to-neutral-800 border border-neutral-700 text-neutral-200 text-xl font-semibold flex items-center min-w-max shadow"
          >
            {item.icon && <span className="mr-2">{item.icon}</span>}
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
} 