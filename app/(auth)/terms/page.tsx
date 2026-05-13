import Link from 'next/link'
import { TPMark } from '@/components/brand/tp-mark'

// ── Brand palette ──────────────────────────────────────────────
const P = {
  blue:     '#2A398D',
  gold:     '#C9A84C',
  ink:      '#0B0D18',
  inkPanel: '#181C36',
  inkLine:  'rgba(255,255,255,0.08)',
  sub:      'rgba(255,255,255,0.55)',
  white:    '#FFFFFF',
}

// ── HUD corner bracket ─────────────────────────────────────────
function HUDCorner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const rotation = { tl: 0, tr: 90, bl: -90, br: 180 }[pos]
  const placement: React.CSSProperties =
    pos === 'tl' ? { top: 16, left: 16 } :
    pos === 'tr' ? { top: 16, right: 16 } :
    pos === 'bl' ? { bottom: 16, left: 16 } :
                   { bottom: 16, right: 16 }

  return (
    <div style={{ position: 'absolute', ...placement, transform: `rotate(${rotation}deg)`, zIndex: 3, pointerEvents: 'none' }}>
      <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
        <path d="M2 8 L2 2 L8 2" stroke={P.gold} strokeWidth="1.6" strokeLinecap="square" />
      </svg>
    </div>
  )
}

// ── Section heading ────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
      fontSize: 22, letterSpacing: 1.5, color: P.gold,
      marginTop: 32, marginBottom: 12,
    }}>
      {children}
    </h2>
  )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 20 }}>
      <h3 style={{
        fontFamily: 'var(--font-archivo), system-ui',
        fontSize: 14, fontWeight: 700, color: P.white,
        marginBottom: 8,
      }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────

export const metadata = {
  title: 'Términos y Condiciones — Tiro a Puerta Challenge',
}

export default function TermsPage() {
  // Common paragraph style
  const p: React.CSSProperties = {
    fontFamily: 'var(--font-archivo), system-ui',
    fontSize: 13.5, lineHeight: 1.7, color: P.sub,
    marginBottom: 12,
  }

  const li: React.CSSProperties = {
    ...p,
    marginBottom: 6,
    paddingLeft: 4,
  }

  return (
    <div style={{
      position: 'relative', minHeight: '100svh',
      background: P.ink, color: P.white,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>

      {/* ── Background ── */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(120% 55% at 50% 0%, ${P.blue}30 0%, ${P.ink} 55%, #06080F 100%)`,
        }} />
      </div>

      {/* ── HUD Corners ── */}
      <HUDCorner pos="tl" /><HUDCorner pos="tr" />
      <HUDCorner pos="bl" /><HUDCorner pos="br" />

      {/* ── Content ── */}
      <div style={{
        position: 'relative', zIndex: 2, flex: 1,
        padding: '48px 28px 60px',
        maxWidth: 600, width: '100%', margin: '0 auto',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ filter: `drop-shadow(0 0 16px ${P.gold}44) drop-shadow(0 6px 14px rgba(0,0,0,0.35))` }}>
            <TPMark size={56} />
          </div>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
          fontSize: 30, letterSpacing: 2, color: P.white,
          textAlign: 'center', marginTop: 16, marginBottom: 4,
        }}>
          TÉRMINOS Y CONDICIONES
        </h1>
        <div style={{
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: 10, letterSpacing: 2, color: P.sub,
          textAlign: 'center', marginBottom: 32, textTransform: 'uppercase',
        }}>
          Última actualización: 13 de mayo de 2026
        </div>

        {/* ── Body ── */}
        <div style={{
          background: P.inkPanel, borderRadius: 14, padding: '28px 22px',
          border: `1px solid ${P.inkLine}`,
        }}>

          {/* 1. Organizadores */}
          <SectionTitle>1. Organizadores</SectionTitle>
          <p style={p}>
            &quot;Tiro a Puerta Challenge&quot; (en adelante, &quot;la Plataforma&quot; o &quot;el Torneo&quot;)
            es organizado y operado por Elías Hale, Daniel Occelli y Víctor Bensimon
            (en adelante, &quot;los Organizadores&quot;), personas físicas con domicilio en México.
          </p>
          <p style={p}>
            La Plataforma opera a través del sitio web{' '}
            <span style={{ color: P.gold }}>tiroapuerta.mx</span> y cualquier aplicación
            web o móvil asociada.
          </p>

          {/* 2. Aceptación */}
          <SectionTitle>2. Aceptación de los Términos</SectionTitle>
          <p style={p}>
            Al crear una cuenta en la Plataforma, el usuario declara haber leído, entendido
            y aceptado estos Términos y Condiciones en su totalidad. Si no estás de acuerdo
            con alguno de estos términos, no deberás registrarte ni participar.
          </p>
          <p style={p}>
            Los Organizadores se reservan el derecho de modificar estos términos en cualquier
            momento. En caso de cambios sustanciales, se notificará a los usuarios registrados
            por correo electrónico. El uso continuado de la Plataforma tras la notificación
            constituye aceptación de los términos actualizados.
          </p>

          {/* 3. Descripción */}
          <SectionTitle>3. Descripción del Torneo</SectionTitle>
          <p style={p}>
            Tiro a Puerta Challenge es una quiniela tipo &quot;survivor pool&quot; ambientada en
            la Copa Mundial de la FIFA 2026. Los participantes eligen diariamente a un jugador
            de los partidos del día. Si el jugador registra al menos un tiro a puerta (según la
            definición oficial de FIFA/Opta), el participante sobrevive. Si no, queda eliminado
            de forma definitiva.
          </p>
          <p style={p}>
            Las reglas completas del juego, incluyendo mecánica de picks, criterios de
            supervivencia y eliminación, desempates y casos borde, están documentadas en la
            sección &quot;Reglas del Juego&quot; dentro de la Plataforma. Dichas reglas forman
            parte integral de estos Términos y Condiciones.
          </p>

          {/* 4. Elegibilidad */}
          <SectionTitle>4. Elegibilidad y Registro</SectionTitle>
          <SubSection title="4.1 Requisitos">
            <ul style={{ listStyle: 'disc', paddingLeft: 20 }}>
              <li style={li}>Ser mayor de 18 años de edad.</li>
              <li style={li}>Proporcionar un correo electrónico válido y verificable.</li>
              <li style={li}>Crear un nombre de usuario único que no sea ofensivo ni suplante identidades.</li>
              <li style={li}>Aceptar estos Términos y Condiciones.</li>
              <li style={li}>Recibir aprobación del equipo de Organizadores para participar.</li>
            </ul>
          </SubSection>
          <SubSection title="4.2 Una cuenta por persona">
            <p style={p}>
              Cada persona física puede tener únicamente una cuenta. La creación de múltiples
              cuentas por la misma persona resultará en la descalificación de todas las cuentas
              involucradas, sin derecho a reembolso.
            </p>
          </SubSection>
          <SubSection title="4.3 Cierre de registros">
            <p style={p}>
              Los registros se cierran 5 minutos antes del inicio del partido inaugural del
              Mundial 2026 (11 de junio de 2026, 12:55 pm hora de Ciudad de México). No se
              aceptarán cuentas nuevas después de ese momento.
            </p>
          </SubSection>

          {/* 5. Costo de participación */}
          <SectionTitle>5. Costo de Participación y Premios</SectionTitle>
          <SubSection title="5.1 Inscripción">
            <p style={p}>
              La participación en el Torneo tiene un costo de inscripción de
              <span style={{ color: P.gold, fontWeight: 700 }}> $1,000.00 MXN</span> (mil
              pesos mexicanos) por participante. El pago debe realizarse antes del inicio del
              Torneo mediante los medios que los Organizadores pongan a disposición.
            </p>
          </SubSection>
          <SubSection title="5.2 Premios">
            <p style={p}>
              El premio principal es de
              <span style={{ color: P.gold, fontWeight: 700 }}> $150,000.00 MXN</span> (ciento
              cincuenta mil pesos mexicanos) para el ganador del Torneo. Adicionalmente, se
              otorgarán premios a los participantes que finalicen en el Top 5.
            </p>
            <p style={p}>
              La distribución exacta de premios del Top 5 será comunicada por los Organizadores
              antes del inicio del Torneo. Los premios se entregarán dentro de los 30 días
              naturales siguientes a la conclusión del Torneo.
            </p>
          </SubSection>
          <SubSection title="5.3 Reembolsos">
            <p style={p}>
              No se realizarán reembolsos una vez iniciado el Torneo, salvo en caso de cancelación
              total del mismo por causas atribuibles a los Organizadores. Si un participante es
              descalificado por violación a estos términos, no tendrá derecho a reembolso.
            </p>
          </SubSection>

          {/* 6. Fuente de datos */}
          <SectionTitle>6. Fuente Oficial de Datos</SectionTitle>
          <p style={p}>
            La Plataforma utiliza un proveedor externo de datos deportivos (API-Football) como
            fuente oficial y única para determinar estadísticas de partidos, incluyendo tiros a
            puerta, goles, minutos jugados y alineaciones.
          </p>
          <p style={p}>
            Las decisiones de la Plataforma basadas en los datos del proveedor son definitivas e
            inapelables. Los usuarios no podrán impugnar resultados argumentando discrepancias
            con lo observado en transmisiones televisivas u otras fuentes. Los datos del proveedor
            se consideran finales 24 horas después de la conclusión de cada partido.
          </p>

          {/* 7. Conducta */}
          <SectionTitle>7. Conducta del Usuario</SectionTitle>
          <p style={p}>El usuario se compromete a:</p>
          <ul style={{ listStyle: 'disc', paddingLeft: 20 }}>
            <li style={li}>No crear más de una cuenta por persona.</li>
            <li style={li}>No utilizar bots, scripts o herramientas automatizadas para interactuar con la Plataforma.</li>
            <li style={li}>No explotar errores, bugs o vulnerabilidades de la Plataforma. Cualquier error encontrado debe reportarse a los Organizadores.</li>
            <li style={li}>No suplantar la identidad de otros usuarios o terceros.</li>
            <li style={li}>No intentar acceder a información privilegiada (picks de otros usuarios antes del deadline).</li>
            <li style={li}>Mantener la confidencialidad de sus credenciales de acceso.</li>
          </ul>
          <p style={p}>
            La compartición voluntaria de picks entre usuarios por canales externos (WhatsApp,
            redes sociales, etc.) no está prohibida y es responsabilidad de cada usuario.
          </p>

          {/* 8. Sanciones */}
          <SectionTitle>8. Sanciones y Descalificación</SectionTitle>
          <p style={p}>
            Los Organizadores se reservan el derecho de sancionar o descalificar a cualquier
            participante que viole estos términos o las reglas del juego. Las sanciones pueden
            incluir advertencia, suspensión temporal o descalificación permanente, según la
            gravedad de la falta.
          </p>
          <p style={p}>
            La descalificación implica la pérdida del derecho a cualquier premio, sin derecho
            a reembolso de la inscripción.
          </p>

          {/* 9. Apelaciones */}
          <SectionTitle>9. Apelaciones</SectionTitle>
          <p style={p}>
            Se admiten apelaciones únicamente en casos excepcionales y documentados:
          </p>
          <ul style={{ listStyle: 'disc', paddingLeft: 20 }}>
            <li style={li}>Hackeo demostrable de la cuenta del usuario.</li>
            <li style={li}>Error técnico atribuible a la Plataforma (por ejemplo, un pick que no se guardó por falla del servidor).</li>
            <li style={li}>Falla masiva del proveedor de datos deportivos.</li>
          </ul>
          <p style={p}>
            Las apelaciones deben presentarse por correo electrónico dentro de las 48 horas
            siguientes al evento. La decisión de los Organizadores será final.
          </p>

          {/* 10. Propiedad intelectual */}
          <SectionTitle>10. Propiedad Intelectual</SectionTitle>
          <p style={p}>
            Todo el contenido de la Plataforma, incluyendo pero no limitado a diseño, código,
            gráficos, logos, textos e interfaz de usuario, es propiedad de los Organizadores
            y está protegido por las leyes aplicables de propiedad intelectual.
          </p>
          <p style={p}>
            Los nombres, marcas y logos de la FIFA, Copa Mundial, equipos y jugadores son
            propiedad de sus respectivos titulares y se utilizan con fines informativos.
          </p>

          {/* 11. Limitación de responsabilidad */}
          <SectionTitle>11. Limitación de Responsabilidad</SectionTitle>
          <p style={p}>
            Los Organizadores no serán responsables por:
          </p>
          <ul style={{ listStyle: 'disc', paddingLeft: 20 }}>
            <li style={li}>Interrupciones del servicio por causas de fuerza mayor, fallos técnicos de terceros o mantenimiento programado.</li>
            <li style={li}>Errores o retrasos en los datos proporcionados por el proveedor de datos deportivos.</li>
            <li style={li}>Pérdidas económicas derivadas de la participación en el Torneo más allá del costo de inscripción.</li>
            <li style={li}>Cancelación o suspensión de partidos del Mundial por parte de la FIFA.</li>
            <li style={li}>Acceso no autorizado a cuentas de usuario por negligencia del usuario en el manejo de sus credenciales.</li>
          </ul>
          <p style={p}>
            La Plataforma se ofrece &quot;tal cual&quot; (as-is). Los Organizadores harán su
            mejor esfuerzo por mantener la disponibilidad y correcto funcionamiento, pero no
            garantizan un servicio ininterrumpido.
          </p>

          {/* 12. Cancelación del Torneo */}
          <SectionTitle>12. Cancelación del Torneo</SectionTitle>
          <p style={p}>
            En caso de cancelación total del Torneo por causas de fuerza mayor o decisión de
            los Organizadores antes de su inicio, se reembolsará el 100% de las inscripciones.
          </p>
          <p style={p}>
            Si el Torneo se cancela una vez iniciado, los Organizadores definirán el mecanismo
            de distribución de premios con base en el estado del juego al momento de la
            cancelación, comunicándolo a todos los participantes por correo electrónico.
          </p>

          {/* 13. Legislación aplicable */}
          <SectionTitle>13. Legislación Aplicable</SectionTitle>
          <p style={p}>
            Estos Términos y Condiciones se rigen por las leyes de los Estados Unidos Mexicanos.
            Para cualquier controversia derivada de la interpretación o cumplimiento de estos
            términos, las partes se someten a la jurisdicción de los tribunales competentes de
            la Ciudad de México, renunciando a cualquier otro fuero que pudiera corresponderles.
          </p>

          {/* ── AVISO DE PRIVACIDAD ── */}
          <div style={{
            borderTop: `1px solid ${P.inkLine}`,
            marginTop: 40, paddingTop: 32,
          }}>
            <h1 style={{
              fontFamily: 'var(--font-bebas-neue), Impact, sans-serif',
              fontSize: 26, letterSpacing: 2, color: P.white,
              textAlign: 'center', marginBottom: 24,
            }}>
              AVISO DE PRIVACIDAD
            </h1>

            <SectionTitle>14. Responsable del Tratamiento</SectionTitle>
            <p style={p}>
              Los responsables del tratamiento de tus datos personales son Elías Hale,
              Daniel Occelli y Víctor Bensimon, operando como &quot;Tiro a Puerta Challenge&quot;,
              con domicilio en la Ciudad de México, México.
            </p>
            <p style={p}>
              Para cualquier consulta relacionada con tus datos personales, puedes contactarnos
              en: <span style={{ color: P.gold }}>privacidad@tiroapuerta.mx</span>
            </p>

            <SectionTitle>15. Datos Personales Recabados</SectionTitle>
            <p style={p}>Recabamos los siguientes datos personales:</p>
            <ul style={{ listStyle: 'disc', paddingLeft: 20 }}>
              <li style={li}><strong style={{ color: P.white }}>Datos de identificación:</strong> nombre de usuario, dirección de correo electrónico.</li>
              <li style={li}><strong style={{ color: P.white }}>Datos de autenticación:</strong> contraseña (almacenada de forma cifrada por Supabase Auth), proveedor de OAuth utilizado (Google).</li>
              <li style={li}><strong style={{ color: P.white }}>Datos de uso:</strong> picks realizados, historial de participación, estadísticas del juego, fecha y hora de registro.</li>
              <li style={li}><strong style={{ color: P.white }}>Datos técnicos:</strong> dirección IP, user-agent del navegador (recopilados de forma pasiva para seguridad y detección de fraude).</li>
            </ul>
            <p style={p}>
              No recabamos datos personales sensibles (origen étnico, datos de salud, creencias
              religiosas, orientación sexual, datos biométricos, etc.).
            </p>

            <SectionTitle>16. Finalidades del Tratamiento</SectionTitle>
            <p style={p}>Tus datos personales serán utilizados para:</p>
            <ul style={{ listStyle: 'disc', paddingLeft: 20 }}>
              <li style={li}><strong style={{ color: P.white }}>Finalidades primarias (necesarias):</strong> crear y administrar tu cuenta, gestionar tu participación en el Torneo, procesar picks y resultados, mostrar el leaderboard público (solo username), comunicarte información esencial del Torneo (eliminación, cambios en reglas, etc.), prevenir fraude y conductas prohibidas, y cumplir con obligaciones legales.</li>
              <li style={li}><strong style={{ color: P.white }}>Finalidades secundarias (opcionales):</strong> enviarte resúmenes del Torneo, novedades y comunicaciones promocionales. Puedes optar por no recibir estas comunicaciones en cualquier momento desde la configuración de tu perfil.</li>
            </ul>

            <SectionTitle>17. Derechos ARCO</SectionTitle>
            <p style={p}>
              Conforme a la Ley Federal de Protección de Datos Personales en Posesión de los
              Particulares (LFPDPPP), tienes derecho a Acceder, Rectificar, Cancelar u Oponerte
              al tratamiento de tus datos personales (derechos ARCO).
            </p>
            <p style={p}>
              Para ejercer estos derechos, envía un correo electrónico a{' '}
              <span style={{ color: P.gold }}>privacidad@tiroapuerta.mx</span> indicando:
            </p>
            <ul style={{ listStyle: 'disc', paddingLeft: 20 }}>
              <li style={li}>Tu nombre de usuario y correo electrónico de registro.</li>
              <li style={li}>El derecho que deseas ejercer y la descripción de tu solicitud.</li>
              <li style={li}>Cualquier documento que acredite tu identidad.</li>
            </ul>
            <p style={p}>
              Responderemos a tu solicitud en un plazo máximo de 20 días hábiles.
            </p>

            <SectionTitle>18. Transferencia de Datos</SectionTitle>
            <p style={p}>
              Tus datos personales pueden ser compartidos con los siguientes terceros, exclusivamente
              para las finalidades descritas:
            </p>
            <ul style={{ listStyle: 'disc', paddingLeft: 20 }}>
              <li style={li}><strong style={{ color: P.white }}>Supabase (infraestructura):</strong> almacenamiento de datos y autenticación.</li>
              <li style={li}><strong style={{ color: P.white }}>Vercel (hosting):</strong> alojamiento de la aplicación web.</li>
              <li style={li}><strong style={{ color: P.white }}>Resend (emails):</strong> envío de correos transaccionales y de marketing.</li>
              <li style={li}><strong style={{ color: P.white }}>Sentry (monitoreo):</strong> detección y resolución de errores técnicos.</li>
              <li style={li}><strong style={{ color: P.white }}>Google (autenticación):</strong> si eliges iniciar sesión con Google OAuth.</li>
            </ul>
            <p style={p}>
              No vendemos, alquilamos ni comercializamos tus datos personales a terceros.
            </p>

            <SectionTitle>19. Medidas de Seguridad</SectionTitle>
            <p style={p}>
              Implementamos medidas de seguridad técnicas y organizativas para proteger tus datos
              personales, incluyendo: cifrado de contraseñas, conexiones HTTPS, Row Level Security
              (RLS) a nivel de base de datos, y control de acceso basado en roles.
            </p>

            <SectionTitle>20. Uso de Cookies y Tecnologías de Rastreo</SectionTitle>
            <p style={p}>
              La Plataforma utiliza cookies estrictamente necesarias para el funcionamiento de la
              sesión de autenticación. No utilizamos cookies de publicidad ni de rastreo de terceros.
              Vercel Analytics recopila datos anónimos de uso (sin cookies de identificación personal).
            </p>

            <SectionTitle>21. Cambios al Aviso de Privacidad</SectionTitle>
            <p style={p}>
              Nos reservamos el derecho de modificar este Aviso de Privacidad en cualquier momento.
              Los cambios se publicarán en esta misma página y, en caso de cambios sustanciales,
              se notificará a los usuarios por correo electrónico. La fecha de última actualización
              se indica al inicio de este documento.
            </p>
          </div>

          {/* ── Contact ── */}
          <div style={{
            borderTop: `1px solid ${P.inkLine}`,
            marginTop: 32, paddingTop: 24,
            textAlign: 'center',
          }}>
            <p style={{ ...p, fontSize: 12, marginBottom: 4 }}>
              ¿Preguntas sobre estos términos?
            </p>
            <p style={{
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 12, color: P.gold,
            }}>
              contacto@tiroapuerta.mx
            </p>
          </div>
        </div>

        {/* Back link */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link href="/signup" style={{
            fontFamily: 'var(--font-archivo), system-ui',
            fontSize: 14, color: P.gold, textDecoration: 'none',
            fontWeight: 700,
          }}>
            ← Volver al registro
          </Link>
        </div>

      </div>
    </div>
  )
}
