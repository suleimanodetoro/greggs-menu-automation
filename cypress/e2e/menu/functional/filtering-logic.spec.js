// File: cypress/e2e/menu/functional/filtering-logic.spec.js
import { S } from "../../../support/utils/selectors";

describe("Menu – Filtering Logic (pills + modal)", () => {
  beforeEach(() => {
    cy.visitMenu();
    cy.get(S.pillByName('All')).should("be.visible");
  });

  it("Pill: Breakfast shows only Breakfast section/cards; All resets", () => {
    // Count category headings (only the menu categories have border-b and grey-15)
    cy.get(S.categoryHeading).filter(':visible').then($headings => {
      const totalCategories = $headings.length; // Should be 6
      
      // Click Breakfast pill to filter
      cy.get(S.pillByName('Breakfast')).click();
      cy.get(S.pillByName('Breakfast')).should('have.class', 'text-brand-primary-grey');
      
      // After filtering, only 1 category heading should be visible
      cy.get(S.categoryHeading).filter(':visible').should('have.length', 1);
      cy.contains('h2', /^Breakfast$/i).should('be.visible');
      
      // Breakfast products should be visible
      cy.get(S.card).filter(':visible').should('have.length.greaterThan', 0);
      
      // Click All to reset
      cy.get(S.pillByName('All')).click();
      cy.get(S.pillByName('All')).should('have.class', 'text-brand-primary-grey');
      
      // All category headings should be visible again
      cy.get(S.categoryHeading).filter(':visible').should('have.length', totalCategories);
    });
  });

  it("Modal: complex combination (Breakfast + No Wheat + ≤250 kcal) returns intersection only", () => {
    cy.openFilterModal();
    
    // Apply multiple filters
    cy.applyFilters({
      caloriesMax: 250,
      allergens: ["No Wheat"],
      categories: ["Breakfast"],
    });

    // Only 1 category heading should be visible after filtering
    cy.get(S.categoryHeading).filter(':visible').should('have.length', 1);
    cy.contains('h2', /^Breakfast$/i).should('be.visible');
    
    // Filtered products should be visible
    cy.get(S.card).filter(':visible').should('have.length.greaterThan', 0);
    
    // Filter badge should show active filter count
    cy.get(S.filterBadge).should('exist');
  });

  it("Clear All resets state", () => {
    // Count initial category headings
    cy.get(S.categoryHeading).filter(':visible').then($headings => {
      const totalCategories = $headings.length; // Should be 6
      
      cy.openFilterModal();
      
      // Apply allergen filter
      cy.applyFilters({ 
        allergens: ["No Milk"]
      });
      
      // Filter badge should appear
      cy.get(S.filterBadge).should('exist');
      
      // Open modal again to clear
      cy.openFilterModal();
      cy.get(S.filterClear).click();
      
      // Clear doesn't close modal - manually close it
      cy.get(S.filterBack).click();
      cy.get(S.filterModal).should('not.exist');
      
      // Filter badge should be gone
      cy.get(S.filterBadge).should('not.exist');
      
      // All categories should be visible again
      cy.get(S.categoryHeading).filter(':visible').should('have.length', totalCategories);
    });
  });
});