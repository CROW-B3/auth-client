import { type Page, type Locator, expect } from '@playwright/test'
import { BasePage } from './base.page'
import { ROUTES, SELECTORS } from '../fixtures/test-data'

/**
 * Organization Page Object Model (Onboarding Step 1)
 */
export class OrganizationPage extends BasePage {
  readonly organizationNameInput: Locator
  readonly createOrgButton: Locator
  readonly loginLink: Locator
  readonly pageHeader: Locator
  readonly pageDescription: Locator

  constructor(page: Page) {
    super(page)
    this.organizationNameInput = page.locator(SELECTORS.organizationNameInput).first()
    this.createOrgButton = page.locator(SELECTORS.createOrgButton).first()
    this.loginLink = page.locator(SELECTORS.loginLink).first()
    this.pageHeader = page.locator('h1, [class*="title"]').first()
    this.pageDescription = page.locator('p:has-text("organization"), p:has-text("unifying")').first()
  }

  async goto() {
    await super.goto(ROUTES.organization)
    await this.waitForPageLoad()
  }

  async fillOrganizationName(name: string) {
    await this.organizationNameInput.fill(name)
  }

  async clickCreateOrganization() {
    await this.createOrgButton.click()
  }

  async createOrganization(name: string) {
    await this.fillOrganizationName(name)
    await this.clickCreateOrganization()
  }

  async expectFormVisible() {
    await expect(this.organizationNameInput).toBeVisible()
    await expect(this.createOrgButton).toBeVisible()
  }

  async expectButtonLoading() {
    const buttonText = await this.createOrgButton.textContent()
    expect(buttonText?.toLowerCase()).toContain('creating')
  }

  async getOrganizationNameError(): Promise<string | null> {
    const errorLocator = this.page.locator('[class*="error"]:near(input[name="organizationName"])')
    try {
      return await errorLocator.first().textContent()
    } catch {
      return null
    }
  }
}
