/**
 * Custom Commands - Clean OneTrust handling using official API
 * No DOM manipulation, no CSS injection
 */

/** Wait until OneTrust SDK is ready */
Cypress.Commands.add('waitForOneTrust', () => {
  cy.window({ log: false })
    .its('OneTrust')
    .should('be.an', 'object')        // object, not a DOM element
    .its('AllowAll')
    .should('be.a', 'function');      // proves SDK has initialised
});

/**
 * Accept consent using OneTrust API if present; otherwise click the official button.
 * Verifies banner is closed and that OptanonConsent exists.
 */
Cypress.Commands.add('acceptConsent', () => {
  cy.waitForOneTrust();

  cy.window({ log: false }).then((win) => {
    const OT = win.OneTrust;

    // Use vendor API where available
    if (typeof OT.AllowAll === 'function') {
      OT.AllowAll();
    } else if (typeof OT.AcceptAll === 'function') {
      OT.AcceptAll();
    } else {
      // Fallback: click the official accept button (Shadow DOM aware)
      const selectors = [
        '#onetrust-accept-btn-handler',
        'button[aria-label="Accept All"]',
        '#onetrust-cta, .ot-sdk-container [data-opt-in="true"]'
      ];
      cy.get(selectors.join(','), { includeShadowDom: true, timeout: 10000 })
        .filter(':visible')
        .first()
        .should('be.visible')
        .click();
    }

    // Ensure the "alert box closed" state is set on templates that require it
    if (typeof OT.SetAlertBoxClosed === 'function') {
      try { OT.SetAlertBoxClosed(); } catch (_) {}
    }

    // If the SDK emits a consent-changed event, wait for it (max ~8s)
    if (typeof OT.OnConsentChanged === 'function') {
      return new Cypress.Promise((resolve) => {
        const t = setTimeout(resolve, 8000);
        OT.OnConsentChanged(() => { clearTimeout(t); resolve(); });
      });
    }
  });

  // Wait until the banner is reported closed (or deemed unnecessary)
  cy.window({ log: false }).then((win) => {
    cy.wrap(null, { timeout: 15000 }).should(() => {
      const ok = win.OneTrust && typeof win.OneTrust.IsAlertBoxClosed === 'function'
        ? win.OneTrust.IsAlertBoxClosed()
        : true;
      if (!ok) throw new Error('Banner not closed yet');
    });
  });

  // Assert the core consent cookie exists (source of truth)
  cy.getCookie('OptanonConsent', { timeout: 15000, log: false }).should('exist');

  // Some templates do not set this cookie; log instead of failing hard
  cy.getCookie('OptanonAlertBoxClosed', { timeout: 5000, log: false })
    .then((c) => { if (!c) cy.log('ℹ️ OptanonAlertBoxClosed not present on this template'); });
});

/**
 * One-time session initializer: visit, accept consent, cache across specs.
 * NOTE: No otreset/otgeo query params — we rely on the SDK + cookies.
 */
Cypress.Commands.add('ensureConsent', () => {
  cy.session(
    'onetrust:consented:v2',
    () => {
      cy.visit('/', { failOnStatusCode: false });
      cy.acceptConsent();
    },
    {
      cacheAcrossSpecs: true,
      validate: () => {
        cy.getCookie('OptanonConsent', { log: false }).should('exist');
        cy.window({ log: false }).then((win) => {
          const closed = win.OneTrust && typeof win.OneTrust.IsAlertBoxClosed === 'function'
            ? win.OneTrust.IsAlertBoxClosed()
            : true;
          expect(closed, 'CMP banner suppressed').to.be.true;
        });
      }
    }
  );
});

/** Visit a page with consent already handled */
Cypress.Commands.add('visitWithConsent', (path = '/', options = {}) => {
  cy.ensureConsent();
  cy.visit(path, options); // no CMP query string needed
});

/** Wait for page to finish loading (kept lightweight) */
Cypress.Commands.add('waitForPageLoad', () => {
  cy.document().its('readyState').should('eq', 'complete');

  // Optional: wait for common loading indicators to vanish if present
  cy.get('body').then($body => {
    const loadingSelectors = [
      '[class*="loading"]:visible',
      '[class*="spinner"]:visible',
      '.skeleton:visible'
    ];
    loadingSelectors.forEach(selector => {
      if ($body.find(selector).length > 0) {
        cy.get(selector, { timeout: 10000 }).should('not.exist');
      }
    });
  });
});

/** Log metric command */
Cypress.Commands.add('logMetric', (name, value) => {
  const metric = `[METRIC] ${name}: ${value}`;
  cy.task('log', metric);
  Cypress.log({
    name: 'metric',
    message: metric,
    consoleProps: () => ({ name, value })
  });
});

// Tab command for keyboard navigation
Cypress.Commands.add('tab', { prevSubject: 'optional' }, (subject) => {
  if (subject) {
    cy.wrap(subject).trigger('keydown', { 
      keyCode: 9, 
      which: 9, 
      key: 'Tab', 
      shiftKey: false 
    });
  } else {
    cy.focused().trigger('keydown', { 
      keyCode: 9, 
      which: 9, 
      key: 'Tab', 
      shiftKey: false 
    });
  }
});
