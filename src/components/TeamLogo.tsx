import Image from 'next/image'

interface TeamLogoProps {
  url?: string | null
  name: string
  size?: number
  className?: string
}

export default function TeamLogo({ url, name, size = 32, className = '' }: TeamLogoProps) {
  return (
    <div 
      className={`relative rounded-full overflow-hidden flex-shrink-0 bg-[#141414] border border-[#222] flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {url ? (
        <Image
          src={url}
          alt={`Escudo de ${name}`}
          fill
          className="object-cover"
          unoptimized
        />
      ) : (
        <span className="text-[#f5c518] font-black text-[10px]" style={{ fontSize: size * 0.35 }}>
          {name.substring(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  )
}
