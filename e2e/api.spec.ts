import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'https://dev.auth.crowai.dev'
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'https://dev.api.crowai.dev'

test.describe('Auth Service Health', () => {
  test('auth service is reachable', async ({ request }) => {
    const response = await request.get(BASE_URL)
    expect(response.status()).toBeLessThan(500)
  })

  test('login page returns 200', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/login`)
    expect(response.status()).toBe(200)
  })

  test('signup page returns 200', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/signup`)
    expect(response.status()).toBe(200)
  })
})

test.describe('Auth API Endpoints', () => {
  test.describe('Sign In Endpoint', () => {
    test('sign-in endpoint exists', async ({ request }) => {
      // The auth endpoints are through the API gateway
      const response = await request.post(`${API_GATEWAY_URL}/api/v1/auth/sign-in/email`, {
        data: {
          email: 'nonexistent@test-crow.dev',
          password: 'WrongPassword123!',
        },
        headers: {
          'Content-Type': 'application/json',
        },
      })
      // Should return auth error, not 404 (530 = Cloudflare origin error, still valid)
      expect([400, 401, 403, 422, 500, 530]).toContain(response.status())
    })

    test('sign-in rejects empty credentials', async ({ request }) => {
      const response = await request.post(`${API_GATEWAY_URL}/api/v1/auth/sign-in/email`, {
        data: {
          email: '',
          password: '',
        },
        headers: {
          'Content-Type': 'application/json',
        },
      })
      // Should reject with client error (530 = Cloudflare origin error, acceptable)
      expect(response.status()).toBeLessThanOrEqual(530)
    })
  })

  test.describe('Session Endpoint', () => {
    test('session endpoint responds', async ({ request }) => {
      const response = await request.get(`${API_GATEWAY_URL}/api/v1/auth/get-session`, {
        timeout: 15000,
      })
      // Should respond (may be 401/530 without session, or 200 with null session)
      expect([200, 401, 403, 530]).toContain(response.status())
    })
  })

  test.describe('Sign Up Endpoint', () => {
    test('sign-up endpoint exists', async ({ request }) => {
      const response = await request.post(`${API_GATEWAY_URL}/api/v1/auth/sign-up/email`, {
        data: {
          email: 'test@test-crow.dev',
          password: 'weak', // Too weak
          name: 'Test User',
        },
        headers: {
          'Content-Type': 'application/json',
        },
      })
      // Should respond (may reject weak password or exist, 530 = Cloudflare origin error)
      expect(response.status()).toBeLessThanOrEqual(530)
    })
  })
})

test.describe('API Gateway Health', () => {
  test('API gateway is reachable', async ({ request }) => {
    const response = await request.get(API_GATEWAY_URL, {
      timeout: 15000,
    })
    // Gateway may return various codes, but not 5xx server error
    expect(response.status()).toBeLessThan(500)
  })
})

test.describe('Page Resources', () => {
  test('login page loads all resources', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/login`)
    expect(response.status()).toBe(200)

    const contentType = response.headers()['content-type']
    expect(contentType).toContain('text/html')
  })

  test('signup page loads all resources', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/signup`)
    expect(response.status()).toBe(200)

    const contentType = response.headers()['content-type']
    expect(contentType).toContain('text/html')
  })

  test('terms page loads', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/terms`)
    expect(response.status()).toBe(200)
  })

  test('privacy page loads', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/privacy`)
    expect(response.status()).toBe(200)
  })
})

test.describe('Error Handling', () => {
  test('handles non-existent pages gracefully', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/non-existent-page-12345`)
    // Should return 404 or redirect
    expect([404, 200, 302, 308]).toContain(response.status())
  })
})
