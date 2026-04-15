import { useState } from 'react';
import { getContrastText } from './social-cards/cardColorUtils';

const DEFAULT_COLOR = '#10284C';

export default function OrgLogo({ org = {}, size = 40, className = '', variant = 'default' }) {
  const [imgError, setImgError] = useState(false);
  const logoUrl = org.logo_url || null;
  const name = org.name || '';
  const color = org.primary_color || DEFAULT_COLOR;
  const initial = name.charAt(0).toUpperCase() || 'O';
  const textColor = getContrastText(color);
  const fontSize = Math.round(size * 0.4);
  const isSquare = variant === 'square';
  const maxWidth = isSquare ? size : Math.round(size * 2.5);

  if (logoUrl && !imgError) {
    return (
      <img
        src={logoUrl}
        alt={name}
        className={`object-contain ${isSquare ? 'object-cover' : ''} ${className}`}
        style={{
          height: size,
          width: isSquare ? size : 'auto',
          maxWidth,
          borderRadius: 14,
        }}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center font-bold select-none shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: 14,
        backgroundColor: color,
        color: textColor,
        fontSize,
        lineHeight: 1,
      }}
    >
      {initial}
    </div>
  );
}
