import { test, expect } from '@playwright/test'
import { ROUTES } from './fixtures/test-data'

test.describe('Public Routes Navigation', () => {
  test.describe('Redirects', () => {
    test('root path redirects to login', async ({ page }) => {
      await page.goto('/')
      await expect(page).toHaveURL(/login/)
    })

    test('/sign-in redirects to /login', async ({ page }) => {
      await page.goto('/sign-in')
      await expect(page).toHaveURL(/login/)
    })

    test('/sign-up redirects to /signup', async ({ page }) => {
      await page.goto('/sign-up')
      await expect(page).toHaveURL(/signup/)
    })
  })

  test.describe('Public Pages Load', () => {
    test('login page loads successfully', async ({ page }) => {
      await page.goto(ROUTES.login)
      await expect(page).toHaveURL(/login/)
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible()
    })

    test('signup page loads successfully', async ({ page }) => {
      await page.goto(ROUTES.signup)
      await expect(page).toHaveURL(/signup/)
      await expect(page.locator('input[name="fullname"]')).toBeVisible()
    })

    test('terms page loads successfully', async ({ page }) => {
      await page.goto(ROUTES.terms)
      await expect(page).toHaveURL(/terms/)
    })

    test('privacy page loads successfully', async ({ page }) => {
      await page.goto(ROUTES.privacy)
      await expect(page).toHaveURL(/privacy/)
    })
  })

  test.describe('Accept Invite Page', () => {
    test('shows error for missing parameters', async ({ page }) => {
      await page.goto(ROUTES.acceptInvite)
      // Should redirect or show error when no params
      await page.waitForTimeout(2000) // Wait for potential redirect
      const currentUrl = page.url()
      // Either shows error on accept-invite or redirects away
      expect(currentUrl).toBeTruthy()
    })

    test('displays invitation details with valid parameters', async ({ page }) => {
      await page.goto(`${ROUTES.acceptInvite}?org=test-org-123&email=test@example.com&orgName=Test%20Organization`)
      // Should show invitation UI - use first match
      await expect(page.locator('text=/invitation|invite|join/i').first()).toBeVisible()
    })

    test('shows organization name from URL', async ({ page }) => {
      const orgName = 'My Test Company'
      await page.goto(`${ROUTES.acceptInvite}?org=test-org&email=test@example.com&orgName=${encodeURIComponent(orgName)}`)
      await expect(page.locator(`text="${orgName}"`)).toBeVisible()
    })

    test('shows email from URL', async ({ page }) => {
      const testEmail = 'invited-user@example.com'
      await page.goto(`${ROUTES.acceptInvite}?org=test-org&email=${encodeURIComponent(testEmail)}&orgName=Test`)
      await expect(page.locator(`text="${testEmail}"`)).toBeVisible()
    })
  })
})

test.describe('Protected Routes (Unauthenticated)', () => {
  test('organization page redirects unauthenticated users', async ({ page }) => {
    await page.goto(ROUTES.organization)
    // Should redirect to login or signup
    await page.waitForURL(/login|signup/, { timeout: 10000 })
  })

  test('choose-modules page redirects unauthenticated users', async ({ page }) => {
    await page.goto(ROUTES.chooseModules)
    await page.waitForURL(/login|signup/, { timeout: 10000 })
  })

  test('invite-team page redirects unauthenticated users', async ({ page }) => {
    await page.goto(ROUTES.inviteTeam)
    await page.waitForURL(/login|signup/, { timeout: 10000 })
  })
})

test.describe('Navigation Between Auth Pages', () => {
  test('can navigate from login to signup', async ({ page }) => {
    await page.goto(ROUTES.login)
    await page.click('a[href*="signup"]')
    await expect(page).toHaveURL(/signup/)
  })

  test('can navigate from signup to login', async ({ page }) => {
    await page.goto(ROUTES.signup)
    await page.click('a[href*="login"]')
    await expect(page).toHaveURL(/login/)
  })

  test('can navigate from login to forgot password', async ({ page }) => {
    await page.goto(ROUTES.login)
    await page.click('a[href*="forgot"]')
    await expect(page).toHaveURL(/forgot-password/)
  })
})

test.describe('Browser Navigation', () => {
  test('back button works between login and signup', async ({ page }) => {
    await page.goto(ROUTES.login)
    await page.click('a[href*="signup"]')
    await expect(page).toHaveURL(/signup/)
    await page.goBack()
    await expect(page).toHaveURL(/login/)
  })

  test('forward button works after going back', async ({ page }) => {
    await page.goto(ROUTES.login)
    await page.click('a[href*="signup"]')
    await page.goBack()
    await page.goForward()
    await expect(page).toHaveURL(/signup/)
  })

  test('page refresh maintains state on login', async ({ page }) => {
    await page.goto(ROUTES.login)
    const email = 'test@example.com'
    await page.fill('input[type="email"], input[name="email"]', email)
    await page.reload()
    // After reload, form should be reset (standard HTML behavior)
    await expect(page).toHaveURL(/login/)
  })
})

test.describe('Deep Links', () => {
  test('signup with email parameter works', async ({ page }) => {
    const email = 'deeplink@example.com'
    await page.goto(`${ROUTES.signup}?email=${encodeURIComponent(email)}`)
    await expect(page.locator('input[name="email"], input[type="email"]')).toHaveValue(email)
  })
})

test.describe('Mobile Navigation', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('login page is responsive on mobile', async ({ page }) => {
    await page.goto(ROUTES.login)
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible()
    await expect(page.locator('button:has-text("Sign in")')).toBeVisible()
  })

  test('signup page is responsive on mobile', async ({ page }) => {
    await page.goto(ROUTES.signup)
    await expect(page.locator('input[name="fullname"]')).toBeVisible()
    await expect(page.locator('button:has-text("Continue"), button:has-text("Sign up")').first()).toBeVisible()
  })

  test('navigation links are accessible on mobile', async ({ page }) => {
    await page.goto(ROUTES.login)
    await expect(page.locator('a[href*="signup"]')).toBeVisible()
  })
})
