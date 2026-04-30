/**
 * TPMark — "El Momento" (Dirección 3, aprobada en Claude Design)
 *
 * Balón Telstar realista cruzando línea de gol con líneas de movimiento
 * en los colores de marca (azul / rojo / verde). Funciona desde 24px hasta 200px.
 *
 * Exporta también TPWordmark y TPLockup para uso en otras pantallas.
 */

interface TPMarkProps {
  size?: number
  /** Muestra las líneas de movimiento (azul/rojo/verde). Default: true */
  showMotionLines?: boolean
  /** Muestra la línea de gol dorada. Default: true */
  showGoalLine?: boolean
  /** Muestra el halo dorado detrás del balón. Default: true */
  showHalo?: boolean
}

export function TPMark({
  size = 64,
  showMotionLines = true,
  showGoalLine = true,
  showHalo = true,
}: TPMarkProps) {
  // Unique IDs to avoid conflicts when múltiples instancias coexisten en el DOM
  const uid = `tpm-${size}`

  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none">
      {/* Línea de gol (vertical, derecha) */}
      {showGoalLine && (
        <g>
          <line x1="68" y1="10" x2="68" y2="86" stroke="#C9A84C" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="62" y1="10" x2="74" y2="10" stroke="#C9A84C" strokeWidth="3" strokeLinecap="round" />
          <line x1="62" y1="86" x2="74" y2="86" stroke="#C9A84C" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}

      {/* Líneas de movimiento azul / rojo / verde */}
      {showMotionLines && (
        <g>
          <path d="M 6 34 L 30 40"  stroke="#2A398D" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 14 40 L 32 43" stroke="#2A398D" strokeWidth="2"   strokeLinecap="round" opacity="0.5" />
          <path d="M 10 48 L 38 48" stroke="#E61D25" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 18 48 L 34 48" stroke="#E61D25" strokeWidth="2"   strokeLinecap="round" opacity="0.5" />
          <path d="M 6 62 L 30 56"  stroke="#3CAC3B" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 14 56 L 32 53" stroke="#3CAC3B" strokeWidth="2"   strokeLinecap="round" opacity="0.5" />
        </g>
      )}

      {/* Halo dorado detrás del balón */}
      {showHalo && (
        <circle cx="60" cy="48" r="22" fill="#C9A84C" opacity="0.12" />
      )}

      <defs>
        <radialGradient id={`${uid}-grad`} cx="0.32" cy="0.28" r="0.92">
          <stop offset="0%"   stopColor="#FFFFFF" />
          <stop offset="55%"  stopColor="#EFF2F8" />
          <stop offset="92%"  stopColor="#A8AEBE" />
          <stop offset="100%" stopColor="#7A8094" />
        </radialGradient>
        <radialGradient id={`${uid}-gloss`} cx="0.32" cy="0.22" r="0.5">
          <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="60%"  stopColor="#FFFFFF" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${uid}-clip`}>
          <circle cx="60" cy="48" r="14" />
        </clipPath>
      </defs>

      {/* Sombra elíptica debajo del balón */}
      <ellipse cx="62" cy="64" rx="12" ry="2.2" fill="#000" opacity="0.35" />

      {/* Esfera con gradiente radial (volumen real) */}
      <circle cx="60" cy="48" r="14" fill={`url(#${uid}-grad)`} stroke="#0B0D18" strokeWidth="1.4" />

      {/* Paneles del balón (Telstar clásico) — dentro del clip */}
      <g clipPath={`url(#${uid}-clip)`}>
        {/* Pentágono central */}
        <polygon
          points="60,42.5 65,46.2 63.2,52 56.8,52 55,46.2"
          fill="#0B0D18"
          stroke="#0B0D18" strokeWidth="0.4" strokeLinejoin="round"
        />
        {/* Costuras desde vértices del pentágono hacia los hexágonos */}
        <g stroke="#0B0D18" strokeWidth="0.85" strokeLinecap="round" fill="none">
          <line x1="60"   y1="42.5" x2="60"   y2="36"  />
          <line x1="65"   y1="46.2" x2="71"   y2="44"  />
          <line x1="63.2" y1="52"   x2="66.5" y2="58"  />
          <line x1="56.8" y1="52"   x2="53.5" y2="58"  />
          <line x1="55"   y1="46.2" x2="49"   y2="44"  />
        </g>
        {/* Hexágonos parciales en los bordes */}
        <polygon points="71,44 73,40 73.5,46 71.5,49 68,47.5" fill="#0B0D18" stroke="#0B0D18" strokeWidth="0.7" strokeLinejoin="round" />
        <polygon points="49,44 47,40 46.5,46 48.5,49 52,47.5" fill="#0B0D18" stroke="#0B0D18" strokeWidth="0.7" strokeLinejoin="round" />
        <polygon points="53.5,58 51,61.5 54.5,62 57,59.5 56,57.5" fill="#0B0D18" stroke="#0B0D18" strokeWidth="0.7" strokeLinejoin="round" />
        <polygon points="66.5,58 69,61.5 65.5,62 63,59.5 64,57.5" fill="#0B0D18" stroke="#0B0D18" strokeWidth="0.7" strokeLinejoin="round" />
        {/* Costuras adicionales */}
        <g stroke="#0B0D18" strokeWidth="0.65" strokeLinecap="round" fill="none">
          <line x1="60"   y1="36"   x2="60"  y2="34"  />
          <line x1="73.5" y1="46"   x2="74"  y2="48"  />
          <line x1="46.5" y1="46"   x2="46"  y2="48"  />
          <line x1="51"   y1="61.5" x2="50"  y2="62"  />
          <line x1="69"   y1="61.5" x2="70"  y2="62"  />
        </g>
      </g>

      {/* Gloss — brillo especular arriba-izquierda + rim light dorado */}
      <ellipse cx="55" cy="42" rx="3.8" ry="1.8"
        fill="#FFFFFF" opacity="0.7"
        transform="rotate(-32 55 42)"
      />
      <circle cx="60" cy="48" r="14" fill={`url(#${uid}-gloss)`} />
      <path d="M 65 60 Q 70 58 72 53"
        stroke="#FFFFFF" strokeWidth="1.1" fill="none"
        opacity="0.4" strokeLinecap="round"
      />
    </svg>
  )
}

interface TPWordmarkProps {
  /** Color del texto principal "TIRO A PUERTA". Default: white */
  color?: string
  /** Color del "CHALLENGE". Default: gold */
  goldColor?: string
  /** Tamaño: xl / lg / md / sm */
  size?: 'xl' | 'lg' | 'md' | 'sm'
  align?: 'left' | 'center' | 'right'
}

const WORDMARK_SIZES = {
  xl: { main: 32, sub: 13 },
  lg: { main: 24, sub: 10 },
  md: { main: 18, sub: 8 },
  sm: { main: 13, sub: 6 },
}

export function TPWordmark({
  color = '#fff',
  goldColor = '#C9A84C',
  size = 'lg',
  align = 'left',
}: TPWordmarkProps) {
  const s = WORDMARK_SIZES[size]
  return (
    <div style={{ textAlign: align, lineHeight: 1, whiteSpace: 'nowrap' }}>
      <div style={{
        fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
        fontSize: s.main,
        letterSpacing: 1.2,
        color,
        lineHeight: 0.95,
      }}>
        TIRO A PUERTA
      </div>
      <div style={{
        fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
        fontSize: s.sub,
        letterSpacing: s.sub * 0.6,
        color: goldColor,
        marginTop: 5,
      }}>
        CHALLENGE
      </div>
    </div>
  )
}

interface TPLockupProps {
  size?: 'xl' | 'lg' | 'md' | 'sm'
  stack?: 'horizontal' | 'vertical'
  dark?: boolean
}

export function TPLockup({ size = 'lg', stack = 'horizontal', dark = true }: TPLockupProps) {
  const markPx = { xl: 96, lg: 64, md: 48, sm: 32 }[size]
  const wordColor = dark ? '#fff' : '#0B0D18'

  if (stack === 'vertical') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <TPMark size={markPx} />
        <TPWordmark color={wordColor} size={size} align="center" />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <TPMark size={markPx} />
      <TPWordmark color={wordColor} size={size} align="left" />
    </div>
  )
}
