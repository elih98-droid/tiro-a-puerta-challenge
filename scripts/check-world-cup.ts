import { config } from 'dotenv'
config({ path: '.env.local' })

import { getTeams } from '../lib/api-football/client'

async function main() {
  const teams = await getTeams(1, 2026)
  for (const t of teams) {
    if (!t.team.code) {
      console.log(`NULL code: ${t.team.name} (API ID: ${t.team.id})`)
    }
  }
  console.log('Done checking.')
}

main().catch(console.error)
