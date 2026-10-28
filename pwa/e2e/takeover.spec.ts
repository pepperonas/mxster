/**
 * Screens, bots and a host who goes away: the host fills up with a bot, a TV
 * joins as a screen, the round starts; then the host's device disappears and
 * the other account takes over after 30 s and carries on.
 */
import { expect, test, type Page } from '@playwright/test'

async function devLogin(page: Page, email: string, name: string) {
  await page.goto(`/api/auth/dev-login?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`)
}

async function json(page: Page, path: string, method = 'GET', body?: unknown) {
  return page.evaluate(
    async ({ path, method, body }) => {
      const me = await (await fetch('/api/me')).json()
      const res = await fetch(path, {
        method,
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': me.csrf ?? '' },
        body: body === undefined ? undefined : JSON.stringify(body)
      })
      return res.json()
    },
    { path, method, body }
  )
}

test('a screen joins, a bot plays, another account takes over from a vanished host', async ({ browser }) => {
  test.setTimeout(180_000)
  const hostCtx = await browser.newContext()
  const lisaCtx = await browser.newContext()
  const tvCtx = await browser.newContext()
  const host = await hostCtx.newPage()
  const lisa = await lisaCtx.newPage()
  const tv = await tvCtx.newPage()

  // Lisa gets an approved account
  await devLogin(lisa, 'lisa-e2e@example.com', 'Lisa Lustig')
  const lisaMe = await (await lisa.request.get('/api/me')).json()
  await devLogin(host, 'martinpaush@gmail.com', 'Martin Pfeffer')
  await json(host, `/api/admin/users/${lisaMe.id}/approve`, 'POST')

  const room = await json(host, '/api/rooms', 'POST', {
    music: 'room',
    options: { mode: 'timeline_personal', goal: 5, decades: [], challengesEnabled: false, exotics: false }
  })
  const code = room.code as string
  await host.goto(`/room/${code}`)

  await lisa.goto(`/r/${code}`)
  await lisa.getByRole('button', { name: /^beitreten$/i }).click()
  await expect(host.getByText('Lisa')).toBeVisible()

  // A TV joins as a screen
  await tv.goto(`/r/${code}`)
  await tv.getByRole('button', { name: /als bildschirm nutzen/i }).click()
  await tv.getByRole('button', { name: /als bildschirm beitreten/i }).click()
  await expect(host.getByText('Bildschirm', { exact: true }).first()).toBeVisible()

  // One bot, then go
  await host.getByRole('radiogroup', { name: /^bots$/i }).getByRole('radio', { name: '1' }).click()
  await host.getByRole('button', { name: /runde starten/i }).click()

  // Everyone sees the round; the screen does not play along
  await expect(tv.getByText(/ist dran/i).first()).toBeVisible()
  await expect(tv.getByRole('button', { name: /^song (für .+|ziehen)$/i })).toHaveCount(0)
  await expect(lisa.getByText(/bot/i).first()).toBeVisible()

  // The host's device vanishes; after 30 s Lisa may take over
  await hostCtx.close()
  await expect(lisa.getByText(/gastgeber ist nicht verbunden/i)).toBeVisible()
  await expect(lisa.getByRole('button', { name: /spiel übernehmen/i })).toBeVisible({ timeout: 45_000 })
  await lisa.getByRole('button', { name: /spiel übernehmen/i }).click()
  await expect(lisa.getByText(/du leitest jetzt die runde/i)).toBeVisible()

  // Lisa's device runs the round now: whoever is on turn, the round moves on
  // (Martin is away: Lisa may draw for him; the bot is played by her device)
  const draw = lisa.getByRole('button', { name: /^song (für .+|ziehen)$/i })
  await expect(draw).toBeVisible({ timeout: 40_000 })
  await draw.click()
  await expect(tv.getByRole('button', { name: /^pause$|^abspielen$/i }).first()).toBeVisible()

  await lisaCtx.close()
  await tvCtx.close()
})
