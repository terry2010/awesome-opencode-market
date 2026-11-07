/** audit #4 fresh round 10 — the health stamp published to the catalog branch
 *  carried the PREVIOUS run's `pushed` value. publish_health ran right after
 *  diagnose exited, i.e. BEFORE the verdict-push loop resolved; diagnose.ts
 *  merges foreign keys, so the stale `pushed` from an earlier run survives in
 *  $HEALTHF and publish_health reads it. Consequence: digest §⑤ / watchdog
 *  leg reported push status one run late — a first-ever push failure was
 *  invisible until the next tick, and a recovery (spooled→ok) was announced
 *  one cycle late. Fix: every terminal path of the push loop stamps `pushed`
 *  for THIS run and then publishes; non-push ends (fetch/commit failure after
 *  all retries) get an explicit 'not-pushed' stamp so a wedged worker never
 *  keeps broadcasting an old run's ok until its 2h freshness guard expires. */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const SCRIPT = readFileSync(join(__dirname, '..', 'bin', 'ai-diagnose.sh'), 'utf8')

describe('audit#4-r10 — publish_health deferred to this run\'s terminal paths', () => {
  it('no publish_health call sits between diagnose exit and the push loop', () => {
    const afterDiagnose = SCRIPT.slice(
      SCRIPT.indexOf('npx tsx pipeline/ai/diagnose.ts'),
      SCRIPT.indexOf('for i in 1 2 3 4; do'),
    )
    expect(afterDiagnose).not.toContain('publish_health')
  })

  it('every terminal path of the push loop stamps pushed THEN publishes', () => {
    const already = 'stamp_health pushed already-landed; publish_health; exit 0'
    const ok = 'stamp_health pushed ok; publish_health; exit 0'
    expect(SCRIPT).toContain(already)
    expect(SCRIPT).toContain(ok)
    // the spooled tail: stamp, publish, then exit 1 — in that order
    const tail = SCRIPT.slice(SCRIPT.indexOf('stamp_health pushed not-pushed'))
    expect(tail.indexOf('publish_health')).toBeLessThan(tail.indexOf('exit 1'))
    expect(tail).toContain('stamp_health pushed spooled')
    // a wedged worker (commit/fetch failures, no push attempt ever succeeded)
    // is stamped honestly before the spool branch runs
    const notPushed = SCRIPT.indexOf("stamp_health pushed not-pushed")
    const spooled = SCRIPT.indexOf('stamp_health pushed spooled')
    expect(notPushed).toBeGreaterThan(-1)
    expect(notPushed).toBeLessThan(spooled)
  })

  it('the wrapper has exactly four publish call sites, all after a pushed stamp', () => {
    const lines = SCRIPT.split('\n')
    const defs = lines.filter(l => l.startsWith('publish_health()')).length
    const calls = lines.filter(l => /^\s*publish_health\s*$/.test(l) || /; publish_health;/.test(l))
    expect(defs).toBe(1)
    // two inline terminal branches + the not-pushed tail line + the spooled tail line
    expect(calls.length).toBe(4)
  })
})
