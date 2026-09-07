import React from 'react';
import brandLogoImg from '../assets/brand_logo.jpg';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'custom';
  showText?: boolean;
  shape?: 'rounded' | 'circle' | 'square' | 'none';
  alt?: string;
  variant?: 'full' | 'icon' | 'badge';
  dark?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  showText = false,
  shape = 'rounded',
  alt = 'ENH RESTAURANT MANAGEMENT AIDE LTD.',
  variant = 'icon',
  dark = false,
}) => {
  let dimensionClasses = 'w-9 h-9';
  if (size === 'sm') dimensionClasses = 'w-7 h-7';
  if (size === 'lg') dimensionClasses = 'w-14 h-14';
  if (size === 'xl') dimensionClasses = 'w-24 h-24';
  if (size === '2xl') dimensionClasses = 'w-36 h-36 sm:w-44 sm:h-44';
  if (size === 'full') dimensionClasses = 'w-48 h-48 sm:w-60 sm:h-60 max-w-full aspect-square';
  if (size === 'custom') dimensionClasses = '';

  const shapeClasses =
    shape === 'circle'
      ? 'rounded-full'
      : shape === 'square' || shape === 'none'
      ? 'rounded-none'
      : size === '2xl' || size === 'full' || size === 'xl'
      ? 'rounded-2xl'
      : 'rounded-xl';

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        className={`${dimensionClasses} ${shapeClasses} overflow-hidden shrink-0 bg-white shadow-xs border border-amber-900/10 flex items-center justify-center p-0.5`}
      >
        <img
          src={brandLogoImg}
          alt={alt}
          className={`w-full h-full object-contain ${shapeClasses}`}
          referrerPolicy="no-referrer"
        />
      </div>
      {showText && (
        <div className="flex flex-col text-left">
          <span
            className={`text-sm font-black tracking-tight uppercase leading-tight font-sans ${
              dark ? 'text-amber-400' : 'text-[#163352]'
            }`}
          >
            ENH
          </span>
          <span
            className={`text-[8.5px] font-extrabold uppercase tracking-wider ${
              dark ? 'text-slate-400' : 'text-[#163352]/80'
            }`}
          >
            Restaurant Management Aide Ltd.
          </span>
        </div>
      )}
    </div>
  );
};

