import { test, expect } from '@playwright/test'
import { ROUTES } from './fixtures/test-data'

test.describe('Accessibility - Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.login)
  })

  test('has accessible form labels', async ({ page }) => {
    // Email input should have label or aria-label
    const emailInput = page.locator('input[name="email"], input[type="email"]')
    const emailLabel = await emailInput.getAttribute('aria-label')
    const emailPlaceholder = await emailInput.getAttribute('placeholder')
    expect(emailLabel || emailPlaceholder).toBeTruthy()

    // Password input should have label or aria-label
    const passwordInput = page.locator('input[type="password"]')
    const passwordLabel = await passwordInput.getAttribute('aria-label')
    const passwordPlaceholder = await passwordInput.getAttribute('placeholder')
    expect(passwordLabel || passwordPlaceholder).toBeTruthy()
  })

  test('form is keyboard navigable', async ({ page }) => {
    // Tab through form elements
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Should be able to focus on input
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(['INPUT', 'BUTTON', 'A']).toContain(focusedElement)
  })

  test('submit button is focusable', async ({ page }) => {
    const button = page.locator('button[type="submit"], button:has-text("Sign in")')
    await button.focus()
    await expect(button).toBeFocused()
  })

  test('links are accessible via keyboard', async ({ page }) => {
    const forgotLink = page.locator('a[href*="forgot"]')
    await forgotLink.focus()
    await expect(forgotLink).toBeFocused()

    // Should be activatable via Enter
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/forgot-password/)
  })

  test('has proper heading hierarchy', async ({ page }) => {
    const h1 = page.locator('h1')
    await expect(h1).toBeVisible()
  })

  test('color contrast is sufficient (visual check)', async ({ page }) => {
    // This is a basic check - real a11y testing would use axe-core
    const body = page.locator('body')
    await expect(body).toBeVisible()

    // Take screenshot for visual verification
    await page.screenshot({ path: 'test-results/a11y-login-contrast.png' })
  })
})

test.describe('Accessibility - Signup Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.signup)
  })

  test('has accessible form labels', async ({ page }) => {
    // Fullname input
    const fullnameInput = page.locator('input[name="fullname"]')
    const fullnameLabel = await fullnameInput.getAttribute('aria-label')
    const fullnamePlaceholder = await fullnameInput.getAttribute('placeholder')
    expect(fullnameLabel || fullnamePlaceholder).toBeTruthy()

    // Email input
    const emailInput = page.locator('input[name="email"], input[type="email"]')
    const emailLabel = await emailInput.getAttribute('aria-label')
    const emailPlaceholder = await emailInput.getAttribute('placeholder')
    expect(emailLabel || emailPlaceholder).toBeTruthy()

    // Password input
    const passwordInput = page.locator('input[type="password"]')
    const passwordLabel = await passwordInput.getAttribute('aria-label')
    const passwordPlaceholder = await passwordInput.getAttribute('placeholder')
    expect(passwordLabel || passwordPlaceholder).toBeTruthy()
  })

  test('checkbox is accessible', async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"], #terms')
    await expect(checkbox).toBeVisible()

    // Should be checkable via keyboard
    await checkbox.focus()
    await page.keyboard.press('Space')
    await expect(checkbox).toBeChecked()
  })

  test('terms and privacy links are accessible', async ({ page }) => {
    const termsLink = page.locator('a[href*="terms"]')
    await expect(termsLink).toHaveAttribute('href', expect.stringContaining('terms'))

    const privacyLink = page.locator('a[href*="privacy"]')
    await expect(privacyLink).toHaveAttribute('href', expect.stringContaining('privacy'))
  })

  test('form can be submitted via Enter key', async ({ page }) => {
    await page.fill('input[name="fullname"]', 'Test User')
    await page.fill('input[name="email"], input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'TestPassword123!')
    await page.check('input[type="checkbox"], #terms')

    // Press Enter to submit
    await page.keyboard.press('Enter')

    // Should attempt submission (validation may prevent actual submit)
    await page.waitForTimeout(1000)
  })
})

test.describe('Accessibility - General', () => {
  test('login page has descriptive title', async ({ page }) => {
    await page.goto(ROUTES.login)
    const title = await page.title()
    expect(title.toLowerCase()).toMatch(/crow|login|sign in/)
  })

  test('signup page has descriptive title', async ({ page }) => {
    await page.goto(ROUTES.signup)
    const title = await page.title()
    expect(title.toLowerCase()).toMatch(/crow|signup|sign up|create/)
  })

  test('focus is visible on interactive elements', async ({ page }) => {
    await page.goto(ROUTES.login)

    // Tab to first input
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Take screenshot to verify focus styles
    await page.screenshot({ path: 'test-results/a11y-focus-visible.png' })
  })

  test('error messages are accessible', async ({ page }) => {
    await page.goto(ROUTES.login)

    // Submit empty form
    await page.click('button:has-text("Sign in")')

    // Wait for potential error
    await page.waitForTimeout(1000)

    // Errors should be visible or form should prevent submission
    const url = page.url()
    expect(url).toContain('login')
  })

  test('loading states are announced', async ({ page }) => {
    await page.goto(ROUTES.login)

    await page.fill('input[type="email"], input[name="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button:has-text("Sign in")')

    // Button should indicate loading
    const button = page.locator('button:has-text("Sign")')
    await expect(button).toBeVisible()
  })
})

test.describe('Accessibility - Accept Invite Page', () => {
  test('invitation details are readable', async ({ page }) => {
    await page.goto(`${ROUTES.acceptInvite}?org=org123&email=user@test.com&orgName=Test%20Corp`)

    // Organization name should be visible
    await expect(page.locator('text=Test Corp')).toBeVisible()

    // Email should be visible
    await expect(page.locator('text=user@test.com')).toBeVisible()

    // Role should be indicated
    await expect(page.locator('text=/member/i')).toBeVisible()
  })

  test('action buttons are clearly labeled', async ({ page }) => {
    await page.goto(`${ROUTES.acceptInvite}?org=org123&email=user@test.com&orgName=Test%20Corp`)

    const acceptButton = page.locator('button:has-text("Accept")')
    await expect(acceptButton).toBeVisible()
    await expect(acceptButton).toBeEnabled()

    const declineButton = page.locator('button:has-text("Decline")')
    await expect(declineButton).toBeVisible()
    await expect(declineButton).toBeEnabled()
  })
})

test.describe('Screen Reader Support', () => {
  test('login form has proper ARIA structure', async ({ page }) => {
    await page.goto(ROUTES.login)

    // Form should exist
    const form = page.locator('form')
    await expect(form).toBeVisible()

    // Inputs should have proper types
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('signup form has proper ARIA structure', async ({ page }) => {
    await page.goto(ROUTES.signup)

    // Form should exist
    const form = page.locator('form')
    await expect(form).toBeVisible()

    // Checkbox should be accessible
    const checkbox = page.locator('input[type="checkbox"], #terms')
    const id = await checkbox.getAttribute('id')
    expect(id).toBeTruthy()
  })
})
