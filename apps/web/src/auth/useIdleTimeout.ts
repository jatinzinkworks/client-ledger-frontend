import { IDLE_CHECK_INTERVAL_MS, IDLE_TIMEOUT_MS, isIdle } from '@cl/schemas'
import { useEffect, useRef } from 'react'

const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'scroll', 'touchstart'] as const

/** Last activity in any tab, so working in one tab keeps the others signed in. */
const LAST_ACTIVITY_KEY = 'cl-last-activity'
/** Writes to storage at most this often; pointermove fires constantly. */
const SHARE_THROTTLE_MS = 5_000

function readShared(): number {
  try {
    return Number(localStorage.getItem(LAST_ACTIVITY_KEY)) || 0
  } catch {
    return 0
  }
}

function writeShared(at: number): void {
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(at))
  } catch {
    // Storage blocked: each tab times out on its own activity.
  }
}

/** Calls `onIdle` once after `timeoutMs` without activity in any tab of the app. */
export function useIdleTimeout(onIdle: () => void, timeoutMs: number = IDLE_TIMEOUT_MS): void {
  const onIdleRef = useRef(onIdle)
  useEffect(() => {
    onIdleRef.current = onIdle
  })

  useEffect(() => {
    let lastActivity = Date.now()
    let lastShared = 0
    let fired = false

    const record = () => {
      lastActivity = Date.now()
      if (lastActivity - lastShared >= SHARE_THROTTLE_MS) {
        lastShared = lastActivity
        writeShared(lastActivity)
      }
    }
    // Background tabs throttle timers, so also check as soon as the tab is shown again.
    const check = () => {
      if (fired || !isIdle(Math.max(lastActivity, readShared()), Date.now(), timeoutMs)) return
      fired = true
      onIdleRef.current()
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') check()
    }

    record()
    for (const event of ACTIVITY_EVENTS) window.addEventListener(event, record, { capture: true, passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    const timer = window.setInterval(check, IDLE_CHECK_INTERVAL_MS)
    return () => {
      for (const event of ACTIVITY_EVENTS) window.removeEventListener(event, record, { capture: true })
      document.removeEventListener('visibilitychange', onVisibility)
      window.clearInterval(timer)
    }
  }, [timeoutMs])
}
