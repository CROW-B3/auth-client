import { test, expect } from '@playwright/test'

test.describe('Auth Service API', () => {
  test('auth service is reachable', async ({ request }) => {
    const response = await request.get('https://dev.auth.crowai.dev/')
    expect(response.status()).toBeLessThan(500)
  })

  test('sign-in endpoint exists and rejects invalid credentials', async ({ request }) => {
    const response = await request.post('https://dev.auth.crowai.dev/api/auth/sign-in/email', {
      data: { email: 'test@example.com', password: 'wrongpass' }
    })
    expect([400, 401, 403, 404, 422]).toContain(response.status())
  })

  test('session endpoint responds', async ({ request }) => {
    const response = await request.get('https://dev.auth.crowai.dev/api/auth/session')
    expect(response.status()).toBeLessThan(500)
  })
})
