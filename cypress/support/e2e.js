/**
 * Support file with proper OneTrust session management
 * Clean implementation - no global OneTrust hacks
 */

import './commands';
import 'cypress-plugin-tab';
import './commands/menu';
import './utils/selectors';
import './utils/assertions';
import 'cypress-real-events';


// Handle uncaught exceptions - ignore obvious 3rd-party noise
Cypress.on('uncaught:exception', (err) => {
  // Log for visibility in CI output
  // eslint-disable-next-line no-console
  console.log('Uncaught exception:', err && err.message);

  // Let our application errors fail the test:
  if ((err && err.message && (err.message.includes('greggs') || err.message.includes('menu')))) {
    // returning nothing -> Cypress will fail the test
    return;
  }

  // Ignore third-party SDK errors
  return false; // prevents test from failing
});

// Suite init logs
before(() => {
  cy.task('log', '=== Starting Greggs Menu Test Suite ===');
  cy.task('log', `Base URL: ${Cypress.config('baseUrl')}`);
  cy.task('log', `Browser: ${Cypress.browser.name} v${Cypress.browser.version}`);
  cy.task('log', `Viewport: ${Cypress.config('viewportWidth')}x${Cypress.config('viewportHeight')}`);
});

// Ensure a consented session before every test
beforeEach(() => {
  cy.ensureConsent();
});

// Log per-test result + screenshot on failure
afterEach(function () {
  const testStatus = this.currentTest?.state;
  const testTitle  = this.currentTest?.title;
  const suiteTitle = this.currentTest?.parent?.title;

  if (testStatus === 'failed') {
    cy.task('log', ` FAILED: ${suiteTitle} - ${testTitle}`);
    const cleanTitle = (testTitle || 'test').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    cy.screenshot(`failed_${cleanTitle}`, { capture: 'viewport' });
  } else if (testStatus === 'passed') {
    cy.task('log', `PASSED: ${suiteTitle} - ${testTitle}`);
  }
});

// Final summary (best-effort; don't fail if unavailable)
after(() => {
  cy.task('log', '=== Test Suite Completed ===');
  cy.window({ log: false }).then((win) => {
    try {
      const stats = win?.Cypress?.runner?.stats;
      if (stats) {
        cy.task('log', `Summary: ${stats.passes} passed, ${stats.failures} failed, ${stats.pending} pending`);
        cy.task('log', `Duration: ${stats.duration}ms`);
      }
    } catch {
      // ignore cross-origin access issues
    }
  });
});
