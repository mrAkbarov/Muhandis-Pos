import { BRAND_LOGO, BRAND_NAME } from '../../config/brand';

export default function BrandLogo({
  size = 28,
  showName = false,
  iconOnly = false,
  onLight = false,
  nameClassName = 'text-white font-bold text-sm leading-tight',
  className = '',
}) {
  const img = (
    <img
      src={BRAND_LOGO}
      alt={BRAND_NAME}
      className="shrink-0 object-contain"
      style={iconOnly
        ? {
            height: size,
            width: size,
            objectFit: 'cover',
            objectPosition: 'left center',
          }
        : {
            height: size,
            width: 'auto',
            maxWidth: Math.round(size * 5.5),
          }}
    />
  );

  return (
    <div className={`flex items-center gap-2 min-w-0 ${className}`}>
      {onLight ? (
        <div className="rounded-lg bg-white px-2 py-1 shadow-sm">
          {img}
        </div>
      ) : img}
      {showName && (
        <span className={`truncate ${nameClassName}`}>{BRAND_NAME}</span>
      )}
    </div>
  );
}
