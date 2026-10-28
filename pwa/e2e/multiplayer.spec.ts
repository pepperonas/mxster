/**
 * An online round, played by two devices: the host (account) and a guest who
 * joins by link. Covers joining, drawing, placing, the objection window
 * (pass and objection) and that both devices see the same verdict.
 */
import { expect, test, type Page } from '@playwright/test'

async function devLogin(page: Page, email: string, name: string) {
  await page.goto(`/api/auth/dev-login?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`)
  await page.goto('/')
}

async function createRoom(page: Page): Promise<string> {
  return page.evaluate(async () => {
    const me = await (await fetch('/api/me')).json()
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': me.csrf },
      body: JSON.stringify({
        music: 'everyone',
        options: { mode: 'timeline_personal', goal: 5, decades: [], challengesEnabled: true, exotics: false }
      })
    })
    return (await res.json()).code as string
  })
}

/** Draw, put the card into the first gap, confirm. */
async function drawAndPlace(page: Page, gap = 0) {
  await page.getByRole('button', { name: /^song (für .+|ziehen)$/i }).click()
  await page.getByRole('button', { name: /^hier einfügen/i }).nth(gap).click()
  await page.getByRole('button', { name: /^hier platzieren$/i }).click()
}

const verdict = /^(startkarte gelegt|richtig platziert!|leider falsch|einspruch erfolgreich!|beide daneben)$/i
const startCard = /^startkarte gelegt$/i

test('host and guest play an online round', async ({ browser }) => {
  const hostCtx = await browser.newContext()
  const guestCtx = await browser.newContext()
  const host = await hostCtx.newPage()
  const guest = await guestCtx.newPage()

  await devLogin(host, 'martinpaush@gmail.com', 'Martin Pfeffer')
  const code = await createRoom(host)
  await host.goto(`/room/${code}`)

  // The guest joins by link
  await guest.goto(`/r/${code}`)
  await guest.getByLabel(/wie sollen dich die anderen sehen/i).fill('Lisa')
  await guest.getByRole('button', { name: /als gast beitreten/i }).click()
  await expect(host.getByText('Lisa')).toBeVisible()

  await host.getByRole('button', { name: /runde starten/i }).click()

  // Turn 1 (host): the first card is always right, nobody can object
  await drawAndPlace(host)
  await expect(host.getByText(startCard)).toBeVisible()
  await expect(guest.getByText(startCard)).toBeVisible()
  await host.getByRole('button', { name: /^weiter$/i }).click()

  // Turn 2 (guest)
  await drawAndPlace(guest)
  await expect(guest.getByText(startCard)).toBeVisible()
  await guest.getByRole('button', { name: /^weiter$/i }).click()

  // Turn 3 (host): the guest lets it go — both see the same verdict
  await drawAndPlace(host)
  await guest.getByRole('button', { name: /^kein einspruch$/i }).click()
  await expect(host.getByText(verdict).first()).toBeVisible()
  const hostVerdict = await host.getByText(verdict).first().textContent()
  await expect(guest.getByText(hostVerdict!.trim(), { exact: true }).first()).toBeVisible()
  await host.getByRole('button', { name: /^weiter$/i }).click()

  // Turn 4 (guest): the host objects and picks the other gap
  await drawAndPlace(guest, 0)
  await host.getByRole('button', { name: /^einspruch einlegen, /i }).click()
  await host.getByRole('button', { name: /^hier einfügen/i }).last().click()
  // Confirming an objection says what it does
  await host.getByRole('button', { name: /^einspruch einlegen$/i }).click()
  await expect(host.getByText(verdict).first()).toBeVisible()
  const objectionVerdict = await host.getByText(verdict).first().textContent()
  await expect(guest.getByText(objectionVerdict!.trim(), { exact: true }).first()).toBeVisible()

  await hostCtx.close()
  await guestCtx.close()
})
