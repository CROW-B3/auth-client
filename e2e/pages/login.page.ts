import { type Page, type Locator, expect } from '@playwright/test'
import { BasePage } from './base.page'
import { ROUTES, SELECTORS, TIMEOUTS } from '../fixtures/test-data'

/**
 * Login Page Object Model
 */
export class LoginPage extends BasePage {
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly signInButton: Locator
  readonly googleButton: Locator
  readonly forgotPasswordLink: Locator
  readonly signUpLink: Locator
  readonly pageHeader: Locator
  readonly pageDescription: Locator

  constructor(page: Page) {
    super(page)
    this.emailInput = page.locator(SELECTORS.emailInput).first()
    this.passwordInput = page.locator(SELECTORS.passwordInput).first()
    this.signInButton = page.locator(SELECTORS.signInButton).first()
    this.googleButton = page.locator(SELECTORS.googleButton).first()
    this.forgotPasswordLink = page.locator(SELECTORS.forgotPasswordLink).first()
    this.signUpLink = page.locator(SELECTORS.signUpLink).first()
    this.pageHeader = page.locator('h1, [class*="title"]').first()
    this.pageDescription = page.locator('p:has-text("Sign in"), p:has-text("dashboard")').first()
  }

  async goto() {
    await super.goto(ROUTES.login)
    await this.waitForPageLoad()
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email)
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password)
  }

  async fillCredentials(email: string, password: string) {
    await this.fillEmail(email)
    await this.fillPassword(password)
  }

  async clickSignIn() {
    await this.signInButton.click()
  }

  async clickGoogleLogin() {
    await this.googleButton.click()
  }

  async clickForgotPassword() {
    await this.forgotPasswordLink.click()
  }

  async clickSignUpLink() {
    await this.signUpLink.click()
  }

  async login(email: string, password: string) {
    await this.fillCredentials(email, password)
    await this.clickSignIn()
  }

  async expectFormVisible() {
    await expect(this.emailInput).toBeVisible()
    await expect(this.passwordInput).toBeVisible()
    await expect(this.signInButton).toBeVisible()
  }

  async expectGoogleButtonVisible() {
    await expect(this.googleButton).toBeVisible()
  }

  async expectForgotPasswordLinkVisible() {
    await expect(this.forgotPasswordLink).toBeVisible()
  }

  async expectSignUpLinkVisible() {
    await expect(this.signUpLink).toBeVisible()
  }

  async expectLoginError() {
    // Wait for error to appear (toast or inline error)
    const errorLocator = this.page
      .locator(`${SELECTORS.toast}, ${SELECTORS.errorAlert}`)
      .or(this.page.getByText(/invalid|error|failed|incorrect/i))
      .first()
    await expect(errorLocator).toBeVisible({ timeout: TIMEOUTS.medium })
  }

  async expectButtonLoading() {
    const buttonText = await this.signInButton.textContent()
    expect(buttonText?.toLowerCase()).toContain('signing')
  }

  async getEmailError(): Promise<string | null> {
    const errorLocator = this.page.locator('[class*="error"]:near(input[name="email"])')
    try {
      return await errorLocator.first().textContent()
    } catch {
      return null
    }
  }

  async getPasswordError(): Promise<string | null> {
    const errorLocator = this.page.locator('[class*="error"]:near(input[type="password"])')
    try {
      return await errorLocator.first().textContent()
    } catch {
      return null
    }
  }
}
