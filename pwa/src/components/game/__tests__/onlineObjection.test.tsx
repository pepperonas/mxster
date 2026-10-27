/**
 * Online every device speaks for one person: the objection button never shows
 * the device owner's own name, and the placer's device offers no objection.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MotionTestProvider } from '@/test/MotionTestProvider'
import { AppProviders } from '@/contexts'
import { PlacementDock, type DockState } from '../PlacementDock'

const offer = (extra: Partial<Extract<DockState, { kind: 'challenge-offer' }>>): DockState => ({
  kind: 'challenge-offer',
  placerName: 'Lisa',
  challengers: [],
  timeline: [],
  gap: 0,
  ...extra
})

const show = (state: DockState) =>
  render(
    <MotionTestProvider>
      <AppProviders>
      <PlacementDock state={state} boardRef={{ current: null }} onHoverGap={() => {}} onPreview={() => {}} onConfirm={() => {}} onContinue={() => {}} />
      </AppProviders>
    </MotionTestProvider>
  )

describe('objection online', () => {
  it('a plain button, not one’s own name', () => {
    show(offer({ online: true, challengers: [{ seat: 0, name: 'Martin', left: 2 }] }))
    expect(screen.getByRole('button', { name: /Einspruch einlegen, 2 Einsprüche übrig/ })).toBeTruthy()
    expect(screen.queryByText('Martin')).toBeNull()
  })

  it('the placer’s device only says that the others may object', () => {
    show(offer({ online: true, ownCard: true, revealBy: undefined }))
    expect(screen.getByText('Die anderen können jetzt Einspruch einlegen.')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /^Einspruch/ })).toBeNull()
  })

  it('on one device the names stay (who objects)', () => {
    show(offer({ challengers: [{ seat: 1, name: 'Tom', left: 3 }] }))
    expect(screen.getByRole('button', { name: /Tom legt Einspruch ein/ })).toBeTruthy()
  })
})
