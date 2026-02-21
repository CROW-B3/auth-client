import { test, expect } from '@playwright/test'

test.describe('Login Page', () => {
  test('renders login form with all required fields', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[type="email"], input[name="email"]').fill('invalid@example.com')
    await page.locator('input[type="password"]').fill('wrongpassword123')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page.locator('[role="alert"], .error, [data-error]').first()).toBeVisible({ timeout: 8000 })
  })

  test('page title identifies CROW platform', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle(/crow/i)
  })

  test('forgot password link is present', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('link', { name: /forgot/i })).toBeVisible()
  })
})

test.describe('Signup Page', () => {
  test('renders signup form', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign up|create|register/i })).toBeVisible()
  })
})
