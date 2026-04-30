export default function StarLogo({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Círculo fondo */}
      <circle cx="50" cy="50" r="48" fill="#1a0a0a" stroke="#c0392b" strokeWidth="3" />
      {/* Estrella */}
      <polygon
        points="50,12 61,37 88,37 66,54 74,80 50,64 26,80 34,54 12,37 39,37"
        fill="#f5c518"
        stroke="#e67e22"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Texto ESTRELLA */}
      <text x="50" y="95" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#f5c518" fontFamily="system-ui">
        ESTRELLA
      </text>
    </svg>
  )
}
