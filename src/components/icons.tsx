interface IconProps {
  size?: number;
  className?: string;
}

const baseProps = (size: number, className: string) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className,
});

export const SearchIcon = ({ size = 19, className = "" }: IconProps) => (
  <svg {...baseProps(size, className)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

export const UserIcon = ({ size = 19, className = "" }: IconProps) => (
  <svg {...baseProps(size, className)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
  </svg>
);

export const CartIcon = ({ size = 20, className = "" }: IconProps) => (
  <svg {...baseProps(size, className)}>
    <path d="M6 7h12l1 13H5L6 7Z" />
    <path d="M9 10V6a3 3 0 0 1 6 0v4" />
  </svg>
);

export const MenuIcon = ({ size = 22, className = "" }: IconProps) => (
  <svg {...baseProps(size, className)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const CloseIcon = ({ size = 22, className = "" }: IconProps) => (
  <svg {...baseProps(size, className)}>
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

export const ChevronDownIcon = ({ size = 16, className = "" }: IconProps) => (
  <svg {...baseProps(size, className)}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export const ArrowLeftIcon = ({ size = 20, className = "" }: IconProps) => (
  <svg {...baseProps(size, className)}>
    <path d="M19 12H5" />
    <path d="M12 19l-7-7 7-7" />
  </svg>
);

export const ArrowUpIcon = ({ size = 20, className = "" }: IconProps) => (
  <svg {...baseProps(size, className)}>
    <path d="M12 19V5" />
    <path d="M5 12l7-7 7 7" />
  </svg>
);

export const RefreshIcon = ({ size = 18, className = "" }: IconProps) => (
  <svg {...baseProps(size, className)}>
    <path d="M21 2v6h-6" />
    <path d="M3 22v-6h6" />
    <path d="M21 8a9 9 0 0 0-15-3.7L3 8" />
    <path d="M3 16a9 9 0 0 0 15 3.7l0-5.7" />
  </svg>
);

export const CheckIcon = ({ size = 24, className = "" }: IconProps) => (
  <svg {...baseProps(size, className)}>
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

export const WhatsAppIcon = ({ size = 22, className = "" }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.248-.644.099-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.98c-1.78-1.778-4.142-2.758-6.656-2.758-5.196 0-9.422 4.226-9.423 9.423 0 1.665.44 3.295 1.273 4.733l-1.295 4.736a1.65 1.65 0 0 0 2.042 2.042l4.736-1.295a9.4 9.4 0 0 0 4.733 1.273c5.197 0 9.423-4.226 9.423-9.423 0-2.514-.98-4.876-2.758-6.656" />
  </svg>
);

/* ── Admin section icons ── */

export const BoxIcon = ({ size = 22, className = "" }: IconProps) => (
  <svg {...baseProps(size, className)}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
  </svg>
);

export const GridIcon = ({ size = 22, className = "" }: IconProps) => (
  <svg {...baseProps(size, className)}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </svg>
);

export const BagIcon = ({ size = 22, className = "" }: IconProps) => (
  <svg {...baseProps(size, className)}>
    <path d="M6 7h12l1 13H5L6 7Z" />
    <path d="M9 10V6a3 3 0 0 1 6 0v4" />
  </svg>
);

export const UsersIcon = ({ size = 22, className = "" }: IconProps) => (
  <svg {...baseProps(size, className)}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M3 20c0-3.5 3-5 6-5s6 1.5 6 5" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M15 20c0-2.5 2-4 4-4s2 1.5 2 4" />
  </svg>
);

export const TicketIcon = ({ size = 22, className = "" }: IconProps) => (
  <svg {...baseProps(size, className)}>
    <path d="M3 9a3 3 0 0 1 0-6h18a3 3 0 0 1 0 6 3 3 0 0 0 0 6 3 3 0 0 1 0 6H3a3 3 0 0 1 0-6 3 3 0 0 0 0-6z" />
    <path d="M13 5v2" />
    <path d="M13 11v2" />
    <path d="M13 17v2" />
  </svg>
);

export const StarIcon = ({ size = 22, className = "" }: IconProps) => (
  <svg {...baseProps(size, className)}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

export const QuoteIcon = ({ size = 22, className = "" }: IconProps) => (
  <svg {...baseProps(size, className)}>
    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2-2-2H4c-1.25 0-2 .75-2 2v6c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
    <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2-2-2h-4c-1.25 0-2 .75-2 2v6c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
  </svg>
);

export const HomeEditIcon = ({ size = 22, className = "" }: IconProps) => (
  <svg {...baseProps(size, className)}>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <path d="M9 22V12h6" />
    <path d="m13.5 6.5 4 4" />
  </svg>
);

export const ImageIcon = ({ size = 16, className = "" }: IconProps) => (
  <svg {...baseProps(size, className)}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </svg>
);
