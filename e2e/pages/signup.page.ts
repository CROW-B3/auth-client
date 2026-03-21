import { type Page, type Locator, expect } from '@playwright/test'
import { BasePage } from './base.page'
import { ROUTES, SELECTORS } from '../fixtures/test-data'

/**
 * Signup Page Object Model
 */
export class SignupPage extends BasePage {
  readonly fullnameInput: Locator
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly termsCheckbox: Locator
  readonly signUpButton: Locator
  readonly googleButton: Locator
  readonly loginLink: Locator
  readonly termsLink: Locator
  readonly privacyLink: Locator
  readonly pageHeader: Locator

  constructor(page: Page) {
    super(page)
    this.fullnameInput = page.locator(SELECTORS.fullnameInput).first()
    this.emailInput = page.locator(SELECTORS.emailInput).first()
    this.passwordInput = page.locator(SELECTORS.passwordInput).first()
    this.termsCheckbox = page.locator(SELECTORS.termsCheckbox).first()
    this.signUpButton = page.locator(SELECTORS.signUpButton).first()
    this.googleButton = page.locator(SELECTORS.googleButton).first()
    this.loginLink = page.locator(SELECTORS.loginLink).first()
    this.termsLink = page.locator(SELECTORS.termsLink).first()
    this.privacyLink = page.locator(SELECTORS.privacyLink).first()
    this.pageHeader = page.locator('h1, [class*="title"]').first()
  }

  async goto() {
    await super.goto(ROUTES.signup)
    await this.waitForPageLoad()
  }

  async gotoWithEmail(email: string) {
    await super.goto(`${ROUTES.signup}?email=${encodeURIComponent(email)}`)
    await this.waitForPageLoad()
  }

  async fillFullname(fullname: string) {
    await this.fullnameInput.fill(fullname)
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email)
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password)
  }

  async checkTerms() {
    await this.termsCheckbox.check()
  }

  async uncheckTerms() {
    await this.termsCheckbox.uncheck()
  }

  async fillSignupForm(data: {
    fullname: string
    email: string
    password: string
    acceptTerms?: boolean
  }) {
    await this.fillFullname(data.fullname)
    await this.fillEmail(data.email)
    await this.fillPassword(data.password)
    if (data.acceptTerms !== false) {
      await this.checkTerms()
    }
  }

  async clickSignUp() {
    await this.signUpButton.click()
  }

  async clickGoogleSignup() {
    await this.googleButton.click()
  }

  async clickLoginLink() {
    await this.loginLink.click()
  }

  async clickTermsLink() {
    await this.termsLink.click()
  }

  async clickPrivacyLink() {
    await this.privacyLink.click()
  }

  async signup(data: {
    fullname: string
    email: string
    password: string
    acceptTerms?: boolean
  }) {
    await this.fillSignupForm(data)
    await this.clickSignUp()
  }

  async expectFormVisible() {
    await expect(this.fullnameInput).toBeVisible()
    await expect(this.emailInput).toBeVisible()
    await expect(this.passwordInput).toBeVisible()
    await expect(this.termsCheckbox).toBeVisible()
    await expect(this.signUpButton).toBeVisible()
  }

  async expectGoogleButtonVisible() {
    await expect(this.googleButton).toBeVisible()
  }

  async expectLoginLinkVisible() {
    await expect(this.loginLink).toBeVisible()
  }

  async expectTermsAndPrivacyLinksVisible() {
    await expect(this.termsLink).toBeVisible()
    await expect(this.privacyLink).toBeVisible()
  }

  async expectButtonLoading() {
    const buttonText = await this.signUpButton.textContent()
    expect(buttonText?.toLowerCase()).toMatch(/setting|creating|loading/i)
  }

  async expectEmailPrefilled(email: string) {
    await expect(this.emailInput).toHaveValue(email)
  }

  async getFieldError(fieldName: 'fullname' | 'email' | 'password' | 'terms'): Promise<string | null> {
    const errorLocator = this.page.locator(`[class*="error"]:near(input[name="${fieldName}"]), [class*="error"]:near(#${fieldName})`)
    try {
      return await errorLocator.first().textContent()
    } catch {
      return null
    }
  }
}
