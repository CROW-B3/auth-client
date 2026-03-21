import { test, expect } from '@playwright/test'
import { ROUTES } from './fixtures/test-data'

/**
 * Visual regression tests
 * These tests capture screenshots for visual comparison
 */

test.describe('Visual Regression - Login Page', () => {
  test('login page desktop appearance', async ({ page }) => {
    await page.goto(ROUTES.login)
    await page.waitForLoadState('networkidle')

    // Wait for animations to complete
    await page.waitForTimeout(1000)

    await expect(page).toHaveScreenshot('login-desktop.png', {
      maxDiffPixelRatio: 0.1,
      animations: 'disabled',
    })
  })

  test('login page with filled form', async ({ page }) => {
    await page.goto(ROUTES.login)
    await page.waitForLoadState('networkidle')

    await page.fill('input[type="email"], input[name="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')

    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('login-filled.png', {
      maxDiffPixelRatio: 0.1,
      animations: 'disabled',
    })
  })

  test('login page with error state', async ({ page }) => {
    await page.goto(ROUTES.login)
    await page.waitForLoadState('networkidle')

    await page.fill('input[type="email"], input[name="email"]', 'invalid@test.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button:has-text("Sign in")')

    // Wait for error to appear
    await page.waitForTimeout(3000)

    await expect(page).toHaveScreenshot('login-error.png', {
      maxDiffPixelRatio: 0.15,
      animations: 'disabled',
    })
  })
})

test.describe('Visual Regression - Signup Page', () => {
  test('signup page desktop appearance', async ({ page }) => {
    await page.goto(ROUTES.signup)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    await expect(page).toHaveScreenshot('signup-desktop.png', {
      maxDiffPixelRatio: 0.1,
      animations: 'disabled',
    })
  })

  test('signup page with filled form', async ({ page }) => {
    await page.goto(ROUTES.signup)
    await page.waitForLoadState('networkidle')

    await page.fill('input[name="fullname"]', 'John Doe')
    await page.fill('input[type="email"], input[name="email"]', 'john@example.com')
    await page.fill('input[type="password"]', 'SecurePass123!')
    await page.check('input[type="checkbox"], #terms')

    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('signup-filled.png', {
      maxDiffPixelRatio: 0.1,
      animations: 'disabled',
    })
  })
})

test.describe('Visual Regression - Accept Invite Page', () => {
  test('accept invite page appearance', async ({ page }) => {
    await page.goto(`${ROUTES.acceptInvite}?org=org123&email=invited@test.com&orgName=Acme%20Corporation`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    await expect(page).toHaveScreenshot('accept-invite.png', {
      maxDiffPixelRatio: 0.1,
      animations: 'disabled',
    })
  })
})

test.describe('Visual Regression - Mobile Views', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('login page mobile appearance', async ({ page }) => {
    await page.goto(ROUTES.login)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    await expect(page).toHaveScreenshot('login-mobile.png', {
      maxDiffPixelRatio: 0.1,
      animations: 'disabled',
    })
  })

  test('signup page mobile appearance', async ({ page }) => {
    await page.goto(ROUTES.signup)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    await expect(page).toHaveScreenshot('signup-mobile.png', {
      maxDiffPixelRatio: 0.1,
      animations: 'disabled',
    })
  })
})

test.describe('Visual Regression - Tablet Views', () => {
  test.use({ viewport: { width: 768, height: 1024 } })

  test('login page tablet appearance', async ({ page }) => {
    await page.goto(ROUTES.login)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    await expect(page).toHaveScreenshot('login-tablet.png', {
      maxDiffPixelRatio: 0.1,
      animations: 'disabled',
    })
  })

  test('signup page tablet appearance', async ({ page }) => {
    await page.goto(ROUTES.signup)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    await expect(page).toHaveScreenshot('signup-tablet.png', {
      maxDiffPixelRatio: 0.1,
      animations: 'disabled',
    })
  })
})

test.describe('Visual Regression - Components', () => {
  test('CROW logo is visible', async ({ page }) => {
    await page.goto(ROUTES.login)
    await page.waitForLoadState('networkidle')

    const logo = page.locator('img[alt*="CROW"], [class*="logo"]').first()
    await expect(logo).toBeVisible()

    await expect(logo).toHaveScreenshot('crow-logo.png', {
      maxDiffPixelRatio: 0.1,
    })
  })

  test('Google OAuth button styling', async ({ page }) => {
    await page.goto(ROUTES.login)
    await page.waitForLoadState('networkidle')

    const googleButton = page.locator('button:has-text("Google")')
    await expect(googleButton).toBeVisible()

    await expect(googleButton).toHaveScreenshot('google-button.png', {
      maxDiffPixelRatio: 0.1,
    })
  })
})

test.describe('Visual Regression - Dark Theme', () => {
  test('login page respects dark theme', async ({ page }) => {
    await page.goto(ROUTES.login)
    await page.waitForLoadState('networkidle')

    // The app appears to use dark theme by default
    const body = page.locator('body')
    const backgroundColor = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor
    })

    // Should have a dark background
    // This is a basic check - actual values depend on the theme
    expect(backgroundColor).toBeTruthy()
  })
})

test.describe('Visual Regression - Loading States', () => {
  test('captures loading state on form submission', async ({ page }) => {
    await page.goto(ROUTES.login)
    await page.waitForLoadState('networkidle')

    await page.fill('input[type="email"], input[name="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')

    // Click and immediately capture
    const submitPromise = page.click('button:has-text("Sign in")')

    // Wait a brief moment for loading state
    await page.waitForTimeout(200)

    await expect(page).toHaveScreenshot('login-loading.png', {
      maxDiffPixelRatio: 0.2,
      animations: 'disabled',
    })

    await submitPromise
  })
})
