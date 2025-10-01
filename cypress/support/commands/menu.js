// File: cypress/support/commands/menu.js
// Domain-focused commands for the Menu page

import { S } from "../utils/selectors";

// Helper to create exact match regex
const anchor = (s) => new RegExp(`^${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

Cypress.Commands.add("visitMenu", (options = {}) => {
  cy.visitWithConsent("/menu", options);   
  cy.waitForPageLoad();                    
});

Cypress.Commands.add('openFilterModal', () => {
  cy.get(S.filterButton).should('be.visible').click();
  cy.get(S.filterModal).should('be.visible');
});

Cypress.Commands.add("closeFilterModal", () => {
  cy.get(S.filterModal).should("be.visible");
  // Prefer the X button or Back button
  cy.get("body").then(($b) => {
    const hasBack = $b.find(S.filterBack).length > 0;
    const hasClose = $b.find('button[type="button"]:has(svg)').first().length > 0;
    
    if (hasClose) {
      // Click the X button (first button with SVG in modal)
      cy.get(S.filterModal).find('button[type="button"]:has(svg)').first().click();
    } else if (hasBack) {
      cy.get(S.filterBack).first().click();
    } else {
      // Fallback: press ESC
      cy.get(S.filterModal).type("{esc}");
    }
  });
  cy.get(S.filterModal).should("not.exist");
});

Cypress.Commands.add('clearAllFilters', () => {
  cy.get(S.filterModal).should('be.visible');
  cy.get(S.filterClear).filter(':visible').first()
    .scrollIntoView({ block: 'center' })
    .click();
  // Modal stays open after clear - need to close manually
  cy.get('[data-test="modalCancel"]').click();
  cy.get('dialog[open]').should('not.exist');
});

Cypress.Commands.add('applyFilters', ({ caloriesMax, allergens = [], categories = [] } = {}) => {
  cy.get(S.filterModal).should('be.visible');

  // Handle calories slider
  if (typeof caloriesMax === 'number') {
    cy.get(S.caloriesSlider).filter(':visible').first()
      .scrollIntoView({ block: 'center' })
      .invoke('val', String(caloriesMax))
      .trigger('input')
      .trigger('change');
    
    // Verify the value was set
    cy.get(S.caloriesSlider).should('have.value', String(caloriesMax));
  }

  // Handle allergens - labels already have "No" prefix, so use them as-is
  allergens.forEach((allergen) => {
    cy.get(S.filterModal).within(() => {
      // The allergen should be passed as "No Wheat", "No Milk", etc.
      cy.contains('label', anchor(allergen))
        .scrollIntoView({ block: 'center' })
        .click();
      
      // Verify checkbox is checked
      cy.contains('label', anchor(allergen))
        .find('input[type="checkbox"]')
        .should('be.checked');
    });
  });

  // Handle categories - need to match just the name part before the count
  categories.forEach((category) => {
    cy.get(S.filterModal).within(() => {
      // Match "Breakfast (20)" when category is "Breakfast"
      cy.contains('label', new RegExp(`^${category}\\s*\\(\\d+\\)$`, 'i'))
        .scrollIntoView({ block: 'center' })
        .click();
      
      // Verify checkbox is checked
      cy.contains('label', new RegExp(`^${category}\\s*\\(\\d+\\)$`, 'i'))
        .find('input[type="checkbox"]')
        .should('be.checked');
    });
  });

  // Apply the filters
  cy.get(S.filterApply).filter(':visible').first()
    .scrollIntoView({ block: 'center' })
    .click();

  // Wait for modal to close
  cy.get('dialog[open]').should('not.exist');
  
  // Verify filter button shows active filters count
  if (allergens.length > 0 || categories.length > 0 || caloriesMax) {
    cy.get(S.filterButton).find('span.absolute').should('exist');
  }
});

Cypress.Commands.add('selectPill', (name) => {
  // Ensure modal is not open before clicking pills
  cy.get('dialog[open]').should('not.exist');
  
  // Store current state to detect change
  cy.get(S.card).filter(':visible').its('length').then(initialCount => {
    // Click the pill
    cy.get(`[data-test-filter="${name}"]`)
      .scrollIntoView({ block: 'center' })
      .click();
    
    // Verify the pill is selected (it should have different styling)
    cy.get(`[data-test-filter="${name}"]`)
      .should('have.class', 'text-brand-primary-grey');
    
    // Wait for DOM to update - cards should change
    if (name !== 'All') {
      // For specific categories, ensure cards have changed
      cy.get(S.card).filter(':visible').should(($cards) => {
        expect($cards.length).to.not.equal(initialCount);
      });
    }
  });
});

Cypress.Commands.add('visibleCards', () =>
  cy.get(S.card).filter(':visible')
);

// Cypress.Commands.add('tab', { prevSubject: 'optional' }, (subject) => {
//   if (subject) {
//     cy.wrap(subject).trigger('keydown', { keyCode: 9, which: 9, key: 'Tab' });
//   } else {
//     cy.focused().trigger('keydown', { keyCode: 9, which: 9, key: 'Tab' });
//   }
// });