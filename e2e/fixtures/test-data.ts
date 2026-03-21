/**
 * Test data constants for E2E tests
 */

export const TEST_USERS = {
  invalid: {
    email: 'invalid-user@test-crow.dev',
    password: 'WrongPassword123!',
  },
  malformed: {
    email: 'not-an-email',
    password: 'short',
  },
} as const

export const VALID_PASSWORD = 'TestPassword123!'
export const WEAK_PASSWORDS = {
  tooShort: 'Test1!',
  noUppercase: 'testpassword123!',
  noLowercase: 'TESTPASSWORD123!',
  noNumber: 'TestPassword!',
  noSpecialChar: 'TestPassword123',
} as const

export const TEST_ORG_NAME = `Test Org ${Date.now()}`

export const ROUTES = {
  login: '/login',
  signup: '/signup',
  forgotPassword: '/forgot-password',
  organization: '/organization',
  chooseModules: '/choose-modules',
  connectProducts: '/connect-products',
  setupComponents: '/setup-components',
  inviteTeam: '/invite-team',
  acceptInvite: '/accept-invite',
  authCallback: '/auth/callback',
  terms: '/terms',
  privacy: '/privacy',
  checkoutSuccess: '/checkout/success',
  checkoutCancel: '/checkout/cancel',
  completeProfile: '/complete-profile',
  onboardingComplete: '/onboarding-complete',
  success: '/success',
} as const

export const API_ENDPOINTS = {
  session: '/api/v1/auth/get-session',
  signInEmail: '/api/auth/sign-in/email',
  signUpEmail: '/api/auth/sign-up/email',
} as const

export const SELECTORS = {
  // Form inputs
  emailInput: 'input[name="email"], input[type="email"]',
  passwordInput: 'input[name="password"], input[type="password"]',
  fullnameInput: 'input[name="fullname"]',
  organizationNameInput: 'input[name="organizationName"]',
  termsCheckbox: 'input[name="terms"], #terms',

  // Buttons
  signInButton: 'button:has-text("Sign in")',
  signUpButton: 'button:has-text("Continue"), button:has-text("Sign up")',
  googleButton: 'button:has-text("Google")',
  createOrgButton: 'button:has-text("Create organization")',

  // Links
  forgotPasswordLink: 'a[href*="forgot"]',
  signUpLink: 'a[href*="signup"]',
  loginLink: 'a[href*="login"]',
  termsLink: 'a[href*="terms"]',
  privacyLink: 'a[href*="privacy"]',

  // UI Elements
  errorAlert: '[role="alert"], .error, [data-error], [class*="error"]',
  toast: '[data-sonner-toast], [class*="toast"], [role="status"]',
  loader: '[class*="animate-spin"], [class*="loader"]',
  navbar: 'nav, [class*="navbar"]',
  logo: 'img[alt*="CROW"], [class*="logo"]',
} as const

export const VALIDATION_MESSAGES = {
  email: {
    required: 'Email is required',
    invalid: 'Please enter a valid email address',
  },
  password: {
    required: 'Password is required',
    tooShort: 'Password must be at least 8 characters',
    noUppercase: 'Password must contain at least one uppercase letter',
    noLowercase: 'Password must contain at least one lowercase letter',
    noNumber: 'Password must contain at least one number',
    noSpecialChar: 'Password must contain at least one special character',
  },
  fullname: {
    tooShort: 'Full name must be at least 2 characters',
    invalid: 'Full name can only contain letters',
  },
  terms: {
    required: 'You must agree to the terms',
  },
} as const

export const TIMEOUTS = {
  short: 3000,
  medium: 5000,
  long: 10000,
  navigation: 15000,
} as const
