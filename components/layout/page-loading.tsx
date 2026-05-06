/**
 * components/layout/page-loading.tsx
 *
 * Shared loading skeleton for game pages.
 * Used by loading.tsx files in each (game) route.
 * Renders inside the game layout — brand bar and bottom nav are already visible.
 */

export function PageLoading() {
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      padding: '40px 24px',
    }}>

      {/* Spinning ball */}
      <div style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        border: '2px solid rgba(201,168,76,0.15)',
        borderTopColor: '#C9A84C',
        animation: 'spin 0.8s linear infinite',
      }} />

      {/* Shimmer cards — hint at content structure */}
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: i === 1 ? 80 : 64,
              borderRadius: 12,
              backgroundColor: '#181C36',
              border: '1px solid rgba(255,255,255,0.06)',
              opacity: 1 - i * 0.15,
              animation: 'tpPulse 1.6s ease-in-out infinite',
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>

    </div>
  )
}
