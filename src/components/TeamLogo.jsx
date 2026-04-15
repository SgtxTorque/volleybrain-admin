import { useState } from 'react';
import { getContrastText } from './social-cards/cardColorUtils';

const DEFAULT_COLOR = '#10284C';
const FALLBACK_GRAY = '#94a3b8';

export default function TeamLogo({ team = {}, size = 32, className = '', showTooltip = false, variant = 'default' }) {
  const [imgError, setImgError] = useState(false);

  const { logo_url, color, name, abbreviation } = team;
  const teamColor = color || DEFAULT_COLOR;
  const initials = abbreviation || (name ? name.slice(0, 2).toUpperCase() : '');
  const fontSize = Math.round(size * 0.4);

  // Dot variant — always a filled circle with team color
  if (variant === 'dot') {
    const dotSize = size === 32 ? 8 : size; // default 8px for dot
    return (
      <span
        className={`inline-flex shrink-0 ${className}`}
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          backgroundColor: color || DEFAULT_COLOR,
        }}
        title={showTooltip ? name : undefined}
      />
    );
  }

  // Watermark variant — reduced opacity, large, no container border-radius
  if (variant === 'watermark') {
    const wmSize = size === 32 ? 192 : size;
    const wmFontSize = Math.round(wmSize * 0.4);

    if (logo_url && !imgError) {
      return (
        <span
          className={`inline-flex items-center justify-center shrink-0 ${className}`}
          style={{ width: wmSize, height: wmSize, opacity: 0.04 }}
          title={showTooltip ? name : undefined}
        >
          <img
            src={logo_url}
            alt=""
            style={{ width: wmSize, height: wmSize, borderRadius: 14, objectFit: 'cover' }}
            onError={() => setImgError(true)}
          />
        </span>
      );
    }

    if (initials) {
      return (
        <span
          className={`inline-flex items-center justify-center shrink-0 ${className}`}
          style={{
            width: wmSize,
            height: wmSize,
            borderRadius: 14,
            backgroundColor: teamColor,
            opacity: 0.04,
            fontFamily: "'Inter Variable', Inter, sans-serif",
            fontWeight: 700,
            fontSize: wmFontSize,
            color: getContrastText(teamColor),
          }}
          title={showTooltip ? name : undefined}
        >
          {initials}
        </span>
      );
    }

    return (
      <span
        className={`inline-flex items-center justify-center shrink-0 ${className}`}
        style={{
          width: wmSize,
          height: wmSize,
          borderRadius: 14,
          backgroundColor: FALLBACK_GRAY,
          opacity: 0.04,
        }}
        title={showTooltip ? name : undefined}
      >
        <svg width={wmSize * 0.4} height={wmSize * 0.4} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </span>
    );
  }

  // Default variant — fallback chain

  // 1. Logo image
  if (logo_url && !imgError) {
    const el = (
      <img
        src={logo_url}
        alt={name || ''}
        className={`shrink-0 ${className}`}
        style={{ width: size, height: size, borderRadius: 14, objectFit: 'cover' }}
        onError={() => setImgError(true)}
      />
    );
    if (showTooltip) {
      return <span title={name} className="inline-flex">{el}</span>;
    }
    return el;
  }

  // 2. Colored initials
  if (initials) {
    return (
      <span
        className={`inline-flex items-center justify-center shrink-0 ${className}`}
        style={{
          width: size,
          height: size,
          borderRadius: 14,
          backgroundColor: teamColor,
          fontFamily: "'Inter Variable', Inter, sans-serif",
          fontWeight: 700,
          fontSize,
          color: getContrastText(teamColor),
          lineHeight: 1,
        }}
        title={showTooltip ? name : undefined}
      >
        {initials}
      </span>
    );
  }

  // 3. Color dot — only color, no text/logo
  if (color) {
    return (
      <span
        className={`inline-flex shrink-0 ${className}`}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: color,
        }}
        title={showTooltip ? name : undefined}
      />
    );
  }

  // 4. Generic fallback — gray rounded square with shield icon
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: 14,
        backgroundColor: FALLBACK_GRAY,
      }}
      title={showTooltip ? name : undefined}
    >
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    </span>
  );
}
