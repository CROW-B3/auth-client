import { type Page, type Locator, expect } from '@playwright/test'
import { SELECTORS, TIMEOUTS } from '../fixtures/test-data'

/**
 * Base Page Object with common functionality
 */
export class BasePage {
  readonly page: Page
  readonly navbar: Locator
  readonly logo: Locator
  readonly loader: Locator

  constructor(page: Page) {
    this.page = page
    this.navbar = page.locator(SELECTORS.navbar).first()
    this.logo = page.locator(SELECTORS.logo).first()
    this.loader = page.locator(SELECTORS.loader).first()
  }

  async goto(path: string) {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' })
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('domcontentloaded')
  }

  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle')
  }

  async getToastMessage(): Promise<string | null> {
    const toast = this.page.locator(SELECTORS.toast).first()
    try {
      await toast.waitFor({ state: 'visible', timeout: TIMEOUTS.medium })
      return await toast.textContent()
    } catch {
      return null
    }
  }

  async expectToastWithText(text: string | RegExp) {
    const toast = this.page.locator(SELECTORS.toast).first()
    await expect(toast).toBeVisible({ timeout: TIMEOUTS.medium })
    await expect(toast).toContainText(text)
  }

  async expectErrorVisible() {
    const error = this.page.locator(SELECTORS.errorAlert).first()
    await expect(error).toBeVisible({ timeout: TIMEOUTS.medium })
  }

  async expectUrl(path: string | RegExp) {
    await expect(this.page).toHaveURL(path)
  }

  async expectTitle(title: string | RegExp) {
    await expect(this.page).toHaveTitle(title)
  }

  async isLoading(): Promise<boolean> {
    return await this.loader.isVisible()
  }

  async waitForLoaderToDisappear() {
    try {
      await this.loader.waitFor({ state: 'hidden', timeout: TIMEOUTS.long })
    } catch {
      // Loader may not have appeared
    }
  }

  async clickLink(href: string) {
    await this.page.click(`a[href*="${href}"]`)
  }

  async screenshot(name: string) {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png` })
  }
}
