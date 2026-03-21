import { test, expect } from '@playwright/test'
import { ROUTES } from './fixtures/test-data'

/**
 * Performance tests
 * These tests verify page load times and responsiveness
 */

test.describe('Page Load Performance', () => {
  test('login page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now()

    await page.goto(ROUTES.login)
    await page.waitForLoadState('domcontentloaded')

    const loadTime = Date.now() - startTime

    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000)

    // Content should be visible
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible()
  })

  test('signup page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now()

    await page.goto(ROUTES.signup)
    await page.waitForLoadState('domcontentloaded')

    const loadTime = Date.now() - startTime

    expect(loadTime).toBeLessThan(5000)
    await expect(page.locator('input[name="fullname"]')).toBeVisible()
  })

  test('accept invite page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now()

    await page.goto(`${ROUTES.acceptInvite}?org=test&email=test@test.com&orgName=Test`)
    await page.waitForLoadState('domcontentloaded')

    const loadTime = Date.now() - startTime

    expect(loadTime).toBeLessThan(5000)
  })
})

test.describe('Interaction Performance', () => {
  test('form inputs respond immediately', async ({ page }) => {
    await page.goto(ROUTES.login)

    const emailInput = page.locator('input[type="email"], input[name="email"]')
    await emailInput.waitFor({ state: 'visible' })

    const startTime = Date.now()
    await emailInput.fill('test@example.com')
    const fillTime = Date.now() - startTime

    // Input should respond within 500ms
    expect(fillTime).toBeLessThan(500)
    await expect(emailInput).toHaveValue('test@example.com')
  })

  test('navigation between pages is fast', async ({ page }) => {
    await page.goto(ROUTES.login)
    await page.waitForLoadState('domcontentloaded')

    const startTime = Date.now()
    await page.click('a[href*="signup"]')
    await page.waitForURL(/signup/)
    const navTime = Date.now() - startTime

    // Navigation should complete within 3 seconds
    expect(navTime).toBeLessThan(3000)
  })

  test('button click responds immediately', async ({ page }) => {
    await page.goto(ROUTES.login)

    const button = page.locator('button:has-text("Sign in")').first()
    await button.waitFor({ state: 'visible' })

    // Fill form first
    await page.fill('input[type="email"], input[name="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')

    const startTime = Date.now()
    await button.click()
    const clickTime = Date.now() - startTime

    // Click should register within 500ms (accounting for network latency)
    expect(clickTime).toBeLessThan(500)
  })
})

test.describe('Network Performance', () => {
  test('login page makes reasonable number of requests', async ({ page }) => {
    const requests: string[] = []

    page.on('request', (request) => {
      requests.push(request.url())
    })

    await page.goto(ROUTES.login)
    await page.waitForLoadState('networkidle')

    // Should not make excessive requests (less than 50)
    expect(requests.length).toBeLessThan(50)
  })

  test('no failed resource loads on login page', async ({ page }) => {
    const failedRequests: string[] = []

    page.on('requestfailed', (request) => {
      failedRequests.push(request.url())
    })

    await page.goto(ROUTES.login)
    await page.waitForLoadState('networkidle')

    // All resources should load successfully
    expect(failedRequests.length).toBe(0)
  })

  test('no failed resource loads on signup page', async ({ page }) => {
    const failedRequests: string[] = []

    page.on('requestfailed', (request) => {
      failedRequests.push(request.url())
    })

    await page.goto(ROUTES.signup)
    await page.waitForLoadState('networkidle')

    expect(failedRequests.length).toBe(0)
  })
})

test.describe('Core Web Vitals', () => {
  test('login page has good LCP', async ({ page }) => {
    await page.goto(ROUTES.login)

    // Measure Largest Contentful Paint
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          resolve(lastEntry?.startTime || 0)
        }).observe({ type: 'largest-contentful-paint', buffered: true })

        // Fallback timeout
        setTimeout(() => resolve(0), 5000)
      })
    })

    // LCP should be under 2.5 seconds for "good" score
    // Using 4 seconds as threshold for CI environments
    expect(Number(lcp)).toBeLessThan(4000)
  })

  test('login page has no layout shifts during load', async ({ page }) => {
    await page.goto(ROUTES.login)
    await page.waitForLoadState('networkidle')

    // Wait for any animations
    await page.waitForTimeout(2000)

    // Basic check that main content is stable
    const form = page.locator('form')
    const initialBox = await form.boundingBox()

    await page.waitForTimeout(500)

    const finalBox = await form.boundingBox()

    // Position should not have shifted significantly
    if (initialBox && finalBox) {
      const xShift = Math.abs((finalBox.x || 0) - (initialBox.x || 0))
      const yShift = Math.abs((finalBox.y || 0) - (initialBox.y || 0))

      expect(xShift).toBeLessThan(10)
      expect(yShift).toBeLessThan(10)
    }
  })
})

test.describe('Memory and Resources', () => {
  test('no console errors on login page', async ({ page }) => {
    const errors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto(ROUTES.login)
    await page.waitForLoadState('networkidle')

    // Filter out known acceptable errors (if any)
    const significantErrors = errors.filter(
      (err) => !err.includes('favicon') && !err.includes('404')
    )

    expect(significantErrors.length).toBe(0)
  })

  test('no console errors on signup page', async ({ page }) => {
    const errors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto(ROUTES.signup)
    await page.waitForLoadState('networkidle')

    const significantErrors = errors.filter(
      (err) => !err.includes('favicon') && !err.includes('404')
    )

    expect(significantErrors.length).toBe(0)
  })

  test('no JavaScript exceptions', async ({ page }) => {
    const exceptions: Error[] = []

    page.on('pageerror', (error) => {
      exceptions.push(error)
    })

    await page.goto(ROUTES.login)
    await page.waitForLoadState('networkidle')

    // Interact with the page
    await page.fill('input[type="email"], input[name="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password')
    await page.click('button:has-text("Sign in")')

    await page.waitForTimeout(2000)

    expect(exceptions.length).toBe(0)
  })
})
