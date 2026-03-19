interface SkyddsrumsSymbolProps {
  className?: string;
  size?: number;
}

export function SkyddsrumsSymbol({ className = "", size = 100 }: SkyddsrumsSymbolProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Blå triangel */}
      <path
        d="M50 10 L90 85 L10 85 Z"
        fill="#005AA0"
        stroke="#003D6E"
        strokeWidth="2"
      />
      
      {/* Tre orange cirklar */}
      <circle cx="50" cy="35" r="6" fill="#FF6B00" />
      <circle cx="35" cy="65" r="6" fill="#FF6B00" />
      <circle cx="65" cy="65" r="6" fill="#FF6B00" />
    </svg>
  );
}
