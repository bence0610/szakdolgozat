import { test, expect } from '@playwright/test';
import { AppShellPage } from './pages/app-shell.page';
import { CartPage } from './pages/cart.page';
import {
  AUTH_RESPONSE,
  MATCH_ID_1,
  SEAT_ID_AVAILABLE,
  OWNER_TOKEN,
  CHATBOT_SEND_RESPONSE,
} from './fixtures/api-mocks';

/**
 * E2E tests for the Floating Chatbot Widget – KTE-059 (Iteration 5).
 *
 * The ChatbotWidgetComponent is a singleton mounted inside the app shell. The
 * CDK overlay is attached globally so the panel is always outside the Angular
 * component tree of the current route.
 *
 * All /chatbot/message API calls are mocked so no real LLM inference occurs
 * during testing.
 *
 * Scenarios:
 *  1. FAB button is visible in the bottom-right corner on the home page
 *  2. Clicking the FAB opens the chat panel
 *  3. Quick-suggestion chips are rendered in the empty (no messages) state
 *  4. The × (close) button in the panel header closes the panel
 *  5. Sending a message shows the bot reply (mock API response)
 *  6. Typing indicator (.kte-chatbot-panel__typing) appears while the API call is in flight
 *  7. The widget (FAB) is NOT rendered on the /checkout route
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockRefreshFail(page: import('@playwright/test').Page): Promise<void> {
  return page.route('**/auth/refresh', (route) =>
    route.fulfill({ status: 401, body: 'Unauthorized' }),
  );
}

function mockRefreshSuccess(page: import('@playwright/test').Page): Promise<void> {
  return page.route('**/auth/refresh', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(AUTH_RESPONSE),
    }),
  );
}

function mockMatchesEmpty(page: import('@playwright/test').Page): Promise<void> {
  return page.route('**/api/matches**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );
}

function mockChatbotSend(
  page: import('@playwright/test').Page,
  body: unknown = CHATBOT_SEND_RESPONSE,
): Promise<void> {
  return page.route('**/chatbot/message', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    }),
  );
}

// ---------------------------------------------------------------------------
// Tests — FAB presence and panel open/close
// ---------------------------------------------------------------------------

test.describe('Chatbot Widget – FAB and panel', () => {
  test.beforeEach(async ({ page }) => {
    await mockRefreshFail(page);
    await mockMatchesEmpty(page);
  });

  test('should display the FAB button fixed in the bottom-right corner on the home page', async ({
    page,
  }) => {
    await page.goto('/');
    const shell = new AppShellPage(page);

    await expect(shell.chatbotFab).toBeVisible();

    // Verify the fixed positioning via computed style. The FAB should be
    // near the bottom-right of the viewport.
    const box = await shell.chatbotFab.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      const viewport = page.viewportSize()!;
      // The FAB should be in the right half and the bottom quarter of the viewport.
      expect(box.x + box.width).toBeGreaterThan(viewport.width / 2);
      expect(box.y).toBeGreaterThan(viewport.height / 2);
    }
  });

  test('should open the chat panel when the FAB is clicked', async ({ page }) => {
    await page.goto('/');
    const shell = new AppShellPage(page);

    // Panel must not be visible before clicking
    await expect(shell.chatbotPanel).not.toBeVisible();

    await shell.chatbotFab.click();

    await expect(shell.chatbotPanel).toBeVisible({ timeout: 3000 });
  });

  test('should show quick-suggestion chips in the empty state', async ({ page }) => {
    await page.goto('/');
    const shell = new AppShellPage(page);

    await shell.chatbotFab.click();
    await expect(shell.chatbotPanel).toBeVisible({ timeout: 3000 });

    // ChatbotStore.suggestions() returns 3 hard-coded Hungarian questions.
    await expect(shell.chatbotSuggestionChips).toHaveCount(3);
    await expect(shell.chatbotSuggestionChips.first()).toBeVisible();
  });

  test('should close the panel when the × button is clicked', async ({ page }) => {
    await page.goto('/');
    const shell = new AppShellPage(page);

    await shell.chatbotFab.click();
    await expect(shell.chatbotPanel).toBeVisible({ timeout: 3000 });

    await shell.chatbotCloseButton.click();

    await expect(shell.chatbotPanel).not.toBeVisible({ timeout: 3000 });
  });

  test('should keep the FAB visible (not hidden) on non-checkout routes', async ({ page }) => {
    // Verify on a different route (home) that the FAB is still rendered.
    await page.goto('/');
    const shell = new AppShellPage(page);

    await expect(shell.chatbotFab).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Tests — message send flow
// ---------------------------------------------------------------------------

test.describe('Chatbot Widget – message send flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockRefreshFail(page);
    await mockMatchesEmpty(page);
    await mockChatbotSend(page);
  });

  test('should display the bot reply after sending a message', async ({ page }) => {
    await page.goto('/');
    const shell = new AppShellPage(page);

    await shell.chatbotFab.click();
    await expect(shell.chatbotPanel).toBeVisible({ timeout: 3000 });

    await shell.chatbotInput.fill('Mikor lesz a következő meccs?');
    await shell.chatbotInput.press('Enter');

    // The user message and then the bot reply should both be rendered as
    // kte-chatbot-message elements.
    await expect(shell.chatbotMessages).toHaveCount(2, { timeout: 5000 });

    // The bot reply text comes from CHATBOT_SEND_RESPONSE.reply
    await expect(shell.chatbotPanel).toContainText(CHATBOT_SEND_RESPONSE.reply, {
      timeout: 5000,
    });
  });

  test('should display the typing indicator while the API call is in flight', async ({ page }) => {
    // Delay the chatbot API response so the typing indicator is visible
    await page.route('**/chatbot/message', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CHATBOT_SEND_RESPONSE),
      });
    });

    await page.goto('/');
    const shell = new AppShellPage(page);

    await shell.chatbotFab.click();
    await expect(shell.chatbotPanel).toBeVisible({ timeout: 3000 });

    await shell.chatbotInput.fill('Mennyibe kerül egy jegy?');
    await shell.chatbotInput.press('Enter');

    // Typing indicator must appear before the response resolves
    await expect(shell.chatbotTypingIndicator).toBeVisible({ timeout: 3000 });

    // After the response resolves the indicator must disappear
    await expect(shell.chatbotTypingIndicator).not.toBeVisible({ timeout: 5000 });
  });

  test('should send a suggestion chip content when a chip is clicked', async ({ page }) => {
    let capturedMessage: string | null = null;

    await page.route('**/chatbot/message', async (route) => {
      const body = JSON.parse(route.request().postData() ?? '{}') as { message?: string };
      capturedMessage = body.message ?? null;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(CHATBOT_SEND_RESPONSE),
      });
    });

    await page.goto('/');
    const shell = new AppShellPage(page);

    await shell.chatbotFab.click();
    await expect(shell.chatbotPanel).toBeVisible({ timeout: 3000 });

    // Click the first suggestion chip
    const firstChip = shell.chatbotSuggestionChips.first();
    const chipText = (await firstChip.textContent())?.trim() ?? '';
    await firstChip.click();

    // Wait for the bot reply to confirm the API was called
    await expect(shell.chatbotMessages).toHaveCount(2, { timeout: 5000 });

    // The chip's text content should have been sent as the message
    expect(capturedMessage).toBe(chipText);
  });
});

// ---------------------------------------------------------------------------
// Tests — checkout route exclusion
// ---------------------------------------------------------------------------

test.describe('Chatbot Widget – hidden on /checkout', () => {
  test('should NOT render the FAB button on the /checkout route', async ({ page }) => {
    await mockRefreshSuccess(page);
    // Checkout shows empty-state when cart is empty — no other mocks needed
    await page.goto('/checkout');
    const shell = new AppShellPage(page);

    // The app shell hides kte-chatbot-widget when the URL starts with /checkout.
    // The FAB button should be absent from the DOM entirely.
    await expect(shell.chatbotFab).not.toBeVisible();
  });

  test('should NOT render the FAB on the /checkout/confirmation route', async ({ page }) => {
    await mockRefreshSuccess(page);
    await page.goto('/checkout/confirmation');
    const shell = new AppShellPage(page);

    await expect(shell.chatbotFab).not.toBeVisible();
  });

  test('should show the FAB again after navigating away from /checkout', async ({ page }) => {
    await mockRefreshFail(page);
    await mockMatchesEmpty(page);

    await page.goto('/checkout');
    const shell = new AppShellPage(page);

    // Hidden on checkout
    await expect(shell.chatbotFab).not.toBeVisible();

    // Navigate to home — FAB should reappear
    await page.goto('/');
    await expect(shell.chatbotFab).toBeVisible({ timeout: 3000 });
  });
});
