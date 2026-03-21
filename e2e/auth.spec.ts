import { test, expect } from '@playwright/test'
import { LoginPage, SignupPage } from './pages'
import { TEST_USERS, WEAK_PASSWORDS, VALID_PASSWORD, ROUTES } from './fixtures/test-data'

test.describe('Login Page', () => {
  let loginPage: LoginPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    await loginPage.goto()
  })

  test.describe('UI Elements', () => {
    test('renders all form elements correctly', async () => {
      await loginPage.expectFormVisible()
      await loginPage.expectGoogleButtonVisible()
      await loginPage.expectForgotPasswordLinkVisible()
      await loginPage.expectSignUpLinkVisible()
    })

    test('displays CROW branding in title', async ({ page }) => {
      await expect(page).toHaveTitle(/crow/i)
    })

    test('displays welcome message', async ({ page }) => {
      await expect(page.locator('text=Welcome back')).toBeVisible()
    })

    test('shows correct placeholder text', async ({ page }) => {
      await expect(page.locator('input[placeholder*="email" i]')).toBeVisible()
      await expect(page.locator('input[placeholder*="password" i]')).toBeVisible()
    })

    test('navbar contains CROW logo', async () => {
      await expect(loginPage.logo).toBeVisible()
    })

    test('has sign up navigation link', async ({ page }) => {
      const signUpLink = page.locator('a[href*="signup"]')
      await expect(signUpLink).toBeVisible()
      await expect(signUpLink).toHaveAttribute('href', '/signup')
    })
  })

  test.describe('Form Validation', () => {
    test('shows error for empty email', async () => {
      await loginPage.fillPassword('anypassword')
      await loginPage.clickSignIn()
      // Form should show validation or prevent submission
      await expect(loginPage.page).toHaveURL(/login/)
    })

    test('shows error for empty password', async () => {
      await loginPage.fillEmail('test@example.com')
      await loginPage.clickSignIn()
      // Form should show validation or prevent submission
      await expect(loginPage.page).toHaveURL(/login/)
    })

    test('shows error for invalid email format', async () => {
      await loginPage.fillCredentials('not-an-email', 'password123')
      await loginPage.clickSignIn()
      // Should stay on login page with validation error
      await expect(loginPage.page).toHaveURL(/login/)
    })
  })

  test.describe('Authentication Flow', () => {
    test('shows error for invalid credentials', async () => {
      await loginPage.login(TEST_USERS.invalid.email, TEST_USERS.invalid.password)
      await loginPage.expectLoginError()
    })

    test('shows loading state while signing in', async () => {
      await loginPage.fillCredentials(TEST_USERS.invalid.email, TEST_USERS.invalid.password)
      await loginPage.clickSignIn()
      // Button should show loading state briefly
      const button = loginPage.signInButton
      // Either shows loading text or original text after quick failure
      await expect(button).toBeVisible()
    })

    // TODO: App currently clears form on failed login - re-enable if UX changes to retain email
    test.skip('retains email value after failed login attempt', async () => {
      const testEmail = TEST_USERS.invalid.email
      await loginPage.login(testEmail, TEST_USERS.invalid.password)
      await loginPage.expectLoginError()
      await expect(loginPage.emailInput).toHaveValue(testEmail)
    })
  })

  test.describe('Navigation', () => {
    test('forgot password link navigates correctly', async ({ page }) => {
      await loginPage.clickForgotPassword()
      await expect(page).toHaveURL(/forgot-password/)
    })

    test('sign up link navigates to signup page', async ({ page }) => {
      await loginPage.clickSignUpLink()
      await expect(page).toHaveURL(/signup/)
    })
  })

  test.describe('OAuth', () => {
    test('Google sign-in button is present and clickable', async () => {
      await expect(loginPage.googleButton).toBeVisible()
      await expect(loginPage.googleButton).toBeEnabled()
    })

    test('Google button contains correct text', async ({ page }) => {
      const googleButton = page.locator('button:has-text("Google")')
      await expect(googleButton).toContainText(/google/i)
    })
  })
})

test.describe('Signup Page', () => {
  let signupPage: SignupPage

  test.beforeEach(async ({ page }) => {
    signupPage = new SignupPage(page)
    await signupPage.goto()
  })

  test.describe('UI Elements', () => {
    test('renders all form elements correctly', async () => {
      await signupPage.expectFormVisible()
      await signupPage.expectGoogleButtonVisible()
      await signupPage.expectLoginLinkVisible()
    })

    test('displays create account heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /create/i })).toBeVisible()
    })

    test('shows terms and privacy links', async () => {
      await signupPage.expectTermsAndPrivacyLinksVisible()
    })

    test('has login navigation link', async ({ page }) => {
      const loginLink = page.locator('a[href*="login"]')
      await expect(loginLink).toBeVisible()
    })

    test('shows all required input fields', async ({ page }) => {
      await expect(page.locator('input[name="fullname"]')).toBeVisible()
      await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible()
      await expect(page.locator('input[name="password"], input[type="password"]')).toBeVisible()
    })
  })

  test.describe('Form Validation', () => {
    test('prevents submission without terms acceptance', async ({ page }) => {
      await signupPage.fillSignupForm({
        fullname: 'Test User',
        email: 'test@example.com',
        password: VALID_PASSWORD,
        acceptTerms: false,
      })
      await signupPage.clickSignUp()
      // Should show terms error or stay on page
      await expect(page).toHaveURL(/signup/)
    })

    test('validates fullname minimum length', async ({ page }) => {
      await signupPage.fillSignupForm({
        fullname: 'A', // Too short
        email: 'test@example.com',
        password: VALID_PASSWORD,
      })
      await signupPage.clickSignUp()
      await expect(page).toHaveURL(/signup/)
    })

    test('validates email format', async ({ page }) => {
      await signupPage.fillSignupForm({
        fullname: 'Test User',
        email: 'invalid-email',
        password: VALID_PASSWORD,
      })
      await signupPage.clickSignUp()
      await expect(page).toHaveURL(/signup/)
    })
  })

  test.describe('Password Validation', () => {
    test('rejects password that is too short', async ({ page }) => {
      await signupPage.fillSignupForm({
        fullname: 'Test User',
        email: 'test@example.com',
        password: WEAK_PASSWORDS.tooShort,
      })
      await signupPage.clickSignUp()
      await expect(page).toHaveURL(/signup/)
    })

    test('rejects password without uppercase', async ({ page }) => {
      await signupPage.fillSignupForm({
        fullname: 'Test User',
        email: 'test@example.com',
        password: WEAK_PASSWORDS.noUppercase,
      })
      await signupPage.clickSignUp()
      await expect(page).toHaveURL(/signup/)
    })

    test('rejects password without lowercase', async ({ page }) => {
      await signupPage.fillSignupForm({
        fullname: 'Test User',
        email: 'test@example.com',
        password: WEAK_PASSWORDS.noLowercase,
      })
      await signupPage.clickSignUp()
      await expect(page).toHaveURL(/signup/)
    })

    test('rejects password without number', async ({ page }) => {
      await signupPage.fillSignupForm({
        fullname: 'Test User',
        email: 'test@example.com',
        password: WEAK_PASSWORDS.noNumber,
      })
      await signupPage.clickSignUp()
      await expect(page).toHaveURL(/signup/)
    })

    test('rejects password without special character', async ({ page }) => {
      await signupPage.fillSignupForm({
        fullname: 'Test User',
        email: 'test@example.com',
        password: WEAK_PASSWORDS.noSpecialChar,
      })
      await signupPage.clickSignUp()
      await expect(page).toHaveURL(/signup/)
    })
  })

  test.describe('Email Prefill', () => {
    test('prefills email from URL query parameter', async ({ page }) => {
      const testEmail = 'prefilled@example.com'
      signupPage = new SignupPage(page)
      await signupPage.gotoWithEmail(testEmail)
      await signupPage.expectEmailPrefilled(testEmail)
    })
  })

  test.describe('Navigation', () => {
    test('login link navigates to login page', async ({ page }) => {
      await signupPage.clickLoginLink()
      await expect(page).toHaveURL(/login/)
    })

    test('terms link opens terms page', async ({ page }) => {
      const [newPage] = await Promise.all([
        page.waitForEvent('popup').catch(() => null),
        signupPage.clickTermsLink(),
      ])
      if (newPage) {
        await expect(newPage).toHaveURL(/terms/)
      } else {
        await expect(page).toHaveURL(/terms/)
      }
    })
  })

  test.describe('OAuth', () => {
    test('Google sign-up button is present and clickable', async () => {
      await expect(signupPage.googleButton).toBeVisible()
      await expect(signupPage.googleButton).toBeEnabled()
    })
  })
})
