'use client'

import { useState } from 'react'

/**
 * MyPicksTabs — tab switcher for /my-picks page.
 * Two tabs: "Mis Picks" (user's own history) and "Rivales 🔥" (community picks).
 * Receives both panels as children via render props pattern.
 */

const P = {
  gold:    '#C9A84C',
  blue:    '#2A398D',
  panel:   '#181C36',
  line:    'rgba(255,255,255,0.08)',
  ink:     '#fff',
  sub:     'rgba(255,255,255,0.45)',
}

type Tab = 'mine' | 'rivals'

export function MyPicksTabs({
  mineContent,
  rivalsContent,
  initialTab = 'mine',
}: {
  mineContent: React.ReactNode
  rivalsContent: React.ReactNode
  initialTab?: Tab
}) {
  const [active, setActive] = useState<Tab>(initialTab)

  return (
    <>
      {/* ── Tab bar ── */}
      <div style={{
        display: 'flex',
        gap: 0,
        margin: '0 16px',
        background: P.panel,
        borderRadius: 10,
        border: `1px solid ${P.line}`,
        padding: 3,
      }}>
        <TabButton
          label="Mis Picks ⚡"
          active={active === 'mine'}
          onClick={() => setActive('mine')}
        />
        <TabButton
          label="Rivales 🔥"
          active={active === 'rivals'}
          onClick={() => setActive('rivals')}
        />
      </div>

      {/* ── Content ── */}
      {active === 'mine' ? mineContent : rivalsContent}
    </>
  )
}

function TabButton({ label, active, onClick }: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '9px 0',
        borderRadius: 8,
        border: 'none',
        background: active
          ? `linear-gradient(180deg, ${P.blue}, #1B2566)`
          : 'transparent',
        color: active ? P.ink : P.sub,
        fontFamily: 'var(--font-archivo), system-ui',
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: 0.3,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        ...(active ? { boxShadow: `0 0 12px ${P.blue}44` } : {}),
      }}
    >
      {label}
    </button>
  )
}
