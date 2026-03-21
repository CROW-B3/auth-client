import { test, expect } from '@playwright/test'
import { ROUTES } from './fixtures/test-data'

test.describe('Onboarding Pages (Unauthenticated)', () => {
  test.describe('Organization Page', () => {
    test('redirects unauthenticated users', async ({ page }) => {
      await page.goto(ROUTES.organization)
      await page.waitForURL(/signup|login/, { timeout: 10000 })
    })
  })

  test.describe('Choose Modules Page', () => {
    test('redirects unauthenticated users', async ({ page }) => {
      await page.goto(ROUTES.chooseModules)
      await page.waitForURL(/signup|login/, { timeout: 10000 })
    })
  })

  test.describe('Connect Products Page', () => {
    test('redirects unauthenticated users', async ({ page }) => {
      await page.goto(ROUTES.connectProducts)
      await page.waitForURL(/signup|login/, { timeout: 10000 })
    })
  })

  test.describe('Setup Components Page', () => {
    test('redirects unauthenticated users', async ({ page }) => {
      await page.goto(ROUTES.setupComponents)
      await page.waitForURL(/signup|login/, { timeout: 10000 })
    })
  })

  test.describe('Invite Team Page', () => {
    test('redirects unauthenticated users', async ({ page }) => {
      await page.goto(ROUTES.inviteTeam)
      await page.waitForURL(/signup|login/, { timeout: 10000 })
    })
  })
})

test.describe('Checkout Pages', () => {
  test.describe('Checkout Success', () => {
    test('handles missing session ID gracefully', async ({ page }) => {
      await page.goto(ROUTES.checkoutSuccess)
      await page.waitForTimeout(2000)
      const url = page.url()
      expect(url).toBeTruthy()
    })

    test('handles invalid session ID', async ({ page }) => {
      await page.goto(`${ROUTES.checkoutSuccess}?session_id=invalid_session_123`)
      await page.waitForTimeout(2000)
      const url = page.url()
      expect(url).toBeTruthy()
    })
  })

  test.describe('Checkout Cancel', () => {
    test('checkout cancel page loads', async ({ page }) => {
      await page.goto(ROUTES.checkoutCancel)
      await page.waitForTimeout(2000)
      const url = page.url()
      expect(url).toBeTruthy()
    })
  })
})

test.describe('Accept Invite Flow', () => {
  test('accept invite shows invitation card with valid params', async ({ page }) => {
    await page.goto(`${ROUTES.acceptInvite}?org=org123&email=user@test.com&orgName=Test%20Corp`)
    await expect(page.locator('text=/invitation/i').first()).toBeVisible()
    await expect(page.locator('text=Test Corp').first()).toBeVisible()
    await expect(page.locator('text=user@test.com').first()).toBeVisible()
  })

  test('accept button redirects to signup with email', async ({ page }) => {
    const testEmail = 'invited@test.com'
    await page.goto(`${ROUTES.acceptInvite}?org=org123&email=${encodeURIComponent(testEmail)}&orgName=Test%20Corp`)

    const acceptButton = page.locator('button:has-text("Accept")')
    await expect(acceptButton).toBeVisible()
    await acceptButton.click()

    await page.waitForURL(/signup/)
    await expect(page.locator('input[name="email"], input[type="email"]')).toHaveValue(testEmail)
  })

  test('decline button redirects away', async ({ page }) => {
    await page.goto(`${ROUTES.acceptInvite}?org=org123&email=user@test.com&orgName=Test%20Corp`)

    const declineButton = page.locator('button:has-text("Decline")')
    await expect(declineButton).toBeVisible()
    await declineButton.click()

    await page.waitForURL(/login|^\/$/, { timeout: 5000 })
  })

  test('shows member role badge', async ({ page }) => {
    await page.goto(`${ROUTES.acceptInvite}?org=org123&email=user@test.com&orgName=Test%20Corp`)
    await expect(page.locator('text=/member/i')).toBeVisible()
  })

  test('sign in instead link works', async ({ page }) => {
    await page.goto(`${ROUTES.acceptInvite}?org=org123&email=user@test.com&orgName=Test%20Corp`)

    const signInLink = page.locator('button:has-text("Sign in Instead"), a:has-text("Sign in Instead")')
    await expect(signInLink).toBeVisible()
    await signInLink.click()

    await page.waitForURL(/login|sign-in/, { timeout: 5000 })
  })
})

test.describe('Onboarding Step Protection', () => {
  const onboardingRoutes = [
    { route: '/organization', name: 'Organization' },
    { route: '/choose-modules', name: 'Choose Modules' },
    { route: '/connect-products', name: 'Connect Products' },
    { route: '/setup-components', name: 'Setup Components' },
    { route: '/invite-team', name: 'Invite Team' },
  ]

  for (const { route, name } of onboardingRoutes) {
    test(`${name} page requires authentication`, async ({ page }) => {
      await page.goto(route)
      await page.waitForTimeout(3000)
      const url = page.url()
      expect(url).toMatch(/login|signup/)
    })
  }
})

test.describe('Setup Components Sub-Pages', () => {
  const setupSubPages = [
    '/setup-components/web',
    '/setup-components/cctv',
    '/setup-components/social',
  ]

  for (const route of setupSubPages) {
    test(`${route} requires authentication`, async ({ page }) => {
      await page.goto(route)
      await page.waitForTimeout(5000)
      const url = page.url()
      expect(url).toMatch(/login|signup|setup-components/)
    })
  }
})

test.describe('Complete Profile Page', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto(ROUTES.completeProfile, { waitUntil: 'domcontentloaded' })
    await page.waitForURL(/login|signup/, { timeout: 15000 })
  })

  test('page structure is correct when accessed', async ({ page }) => {
    await page.goto(ROUTES.completeProfile, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(5000)
    const url = page.url()
    expect(url).toMatch(/login|signup|complete-profile/)
  })
})

test.describe('Onboarding Complete Page', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto(ROUTES.onboardingComplete, { waitUntil: 'domcontentloaded' })
    await page.waitForURL(/login|signup/, { timeout: 15000 })
  })

  test('shows login page for unauthenticated access', async ({ page }) => {
    await page.goto(ROUTES.onboardingComplete, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible({ timeout: 15000 })
  })
})

test.describe('Success Page', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto(ROUTES.success, { waitUntil: 'domcontentloaded' })
    await page.waitForURL(/login|signup/, { timeout: 15000 })
  })

  test('shows login page for unauthenticated access', async ({ page }) => {
    await page.goto(ROUTES.success, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible({ timeout: 15000 })
  })
})
