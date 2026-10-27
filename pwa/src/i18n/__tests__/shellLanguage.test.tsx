import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MotionTestProvider } from '@/test/MotionTestProvider'
import { LanguageProvider, LANG_STORAGE_KEY, getLang, setCurrentLang } from '@/i18n'
import { LanguageSwitch } from '@/components/ui/LanguageSwitch'
import { LoginScreen } from '@/screens/LoginScreen'
import { ApiError } from '@/api/client'
import { apiErrorText, loginErrorText } from '@/i18n/messages/errors'

afterEach(() => {
  localStorage.removeItem(LANG_STORAGE_KEY)
  setCurrentLang('de')
  window.history.replaceState(null, '', '/')
})

describe('LoginScreen language', () => {
  it('renders English when the language is en', () => {
    render(
      <LanguageProvider initial="en">
        <MemoryRouter>
          <MotionTestProvider>
            <LoginScreen />
          </MotionTestProvider>
        </MemoryRouter>
      </LanguageProvider>
    )
    expect(screen.getByRole('link', { name: /sign in with google/i })).toBeTruthy()
    expect(screen.getByText(/guess the year/i)).toBeTruthy()
    expect(screen.queryByText(/mit google anmelden/i)).toBeNull()
    expect(screen.getByRole('link', { name: 'Privacy' }).getAttribute('href')).toBe('/privacy')
  })

  it('switches to English from the switch and translates a login error too', () => {
    window.history.replaceState(null, '', '/?login_error=cancelled')
    render(
      <LanguageProvider initial="de">
        <MemoryRouter>
          <MotionTestProvider>
            <LoginScreen />
          </MotionTestProvider>
        </MemoryRouter>
      </LanguageProvider>
    )
    expect(screen.getByRole('alert').textContent).toBe('Die Anmeldung wurde abgebrochen.')
    fireEvent.click(screen.getByRole('radio', { name: 'English' }))
    expect(screen.getByRole('alert').textContent).toBe('Signing in was cancelled.')
    expect(screen.getByRole('link', { name: /sign in with google/i })).toBeTruthy()
  })
})

describe('LanguageSwitch', () => {
  const renderSwitch = (initial: 'de' | 'en') =>
    render(
      <LanguageProvider initial={initial}>
        <LanguageSwitch />
      </LanguageProvider>
    )

  it('marks the current language and names itself in it', () => {
    renderSwitch('de')
    expect(screen.getByRole('radiogroup', { name: 'Sprache' })).toBeTruthy()
    expect(screen.getByRole('radio', { name: 'Deutsch' }).getAttribute('aria-checked')).toBe('true')
    expect(screen.getByRole('radio', { name: 'English' }).getAttribute('aria-checked')).toBe('false')
  })

  it('switches, stores the choice and relabels itself', () => {
    renderSwitch('de')
    fireEvent.click(screen.getByRole('radio', { name: 'English' }))
    expect(localStorage.getItem(LANG_STORAGE_KEY)).toBe('en')
    expect(getLang()).toBe('en')
    expect(document.documentElement.lang).toBe('en')
    expect(screen.getByRole('radiogroup', { name: 'Language' })).toBeTruthy()
    expect(screen.getByRole('radio', { name: 'English' }).getAttribute('aria-checked')).toBe('true')
  })

  it('moves the choice with the arrow keys', () => {
    renderSwitch('en')
    fireEvent.keyDown(screen.getByRole('radiogroup'), { key: 'ArrowRight' })
    expect(localStorage.getItem(LANG_STORAGE_KEY)).toBe('de')
    expect(screen.getByRole('radio', { name: 'Deutsch' }).getAttribute('aria-checked')).toBe('true')
  })
})

describe('error texts', () => {
  const roomFull = new ApiError(409, 'room_full', 'Der Raum ist voll.')
  const unknown = new ApiError(500, 'something_new', 'Etwas Neues ging schief.')

  it('German keeps the server message', () => {
    expect(apiErrorText(roomFull)).toBe('Der Raum ist voll.')
    expect(apiErrorText(unknown, 'Fallback')).toBe('Etwas Neues ging schief.')
  })

  it('English translates known codes and never shows German for unknown ones', () => {
    setCurrentLang('en')
    expect(apiErrorText(roomFull)).toBe('The room is full.')
    expect(apiErrorText(unknown, 'Fallback')).toBe('Fallback')
    expect(apiErrorText(new Error('boom'), 'Fallback')).toBe('Fallback')
  })

  it('login errors: known codes, unknown ones and inherited object keys', () => {
    expect(loginErrorText('state_mismatch')).toMatch(/abgelaufen/)
    expect(loginErrorText('constructor')).toBe('Die Anmeldung hat nicht geklappt. Bitte versuch es noch einmal.')
    setCurrentLang('en')
    expect(loginErrorText('nope')).toBe('Signing in did not work. Please try again.')
  })
})
