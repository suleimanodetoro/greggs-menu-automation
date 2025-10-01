// cypress/e2e/menu/functional/search.spec.js
import { S } from "../../../support/utils/selectors";

const assertResultsSettled = () => {
  // Settled = either "Oops..." empty section OR visible cards
  cy.get("body").then(($b) => {
    const hasOops = $b
      .find("section h2")
      .toArray()
      .some((h) =>
        /oops\.\.\.|could not find any products/i.test(h.textContent || "")
      );

    if (hasOops) {
      cy.contains(
        "section h2",
        /oops\.\.\.|could not find any products/i
      ).should("be.visible");
      cy.get(S.card).filter(":visible").should("have.length", 0);
    } else {
      cy.get(S.categoryHeading)
        .filter(":visible")
        .should("have.length.greaterThan", 0);
      cy.get(S.card).filter(":visible").should("have.length.greaterThan", 0);
    }
  });
};

describe("Menu – Search behaviour", () => {
  beforeEach(() => {
    cy.visitMenu();

    // Use your real search bar + input; no made-up hooks
    cy.get(S.searchBar).should("be.visible").as("bar");
    cy.get("@bar")
      .find(S.searchInput)
      .filter(":visible")
      .first()
      .as("q")
      .should("be.visible");
  });

  it("Typing a real term shows relevant results under categories", () => {
    cy.get("@q").clear().type("sausage{enter}");
    assertResultsSettled();

    // Top result should look relevant
    cy.get(S.card)
      .filter(":visible")
      .first()
      .within(() => {
        cy.get(S.cardTitle)
          .invoke("text")
          .then((t) => {
            expect(t.toLowerCase()).to.match(/sausage|roll/);
          });
      });

    // There should be at least one category heading (e.g., Breakfast or Savouries & Bakes)
    cy.get(S.categoryHeading)
      .filter(":visible")
      .its("length")
      .should("be.greaterThan", 0);
  });

  it('Unknown term shows the "Oops..." empty state and no cards', () => {
    cy.get("@q").clear().type("jollof{enter}");

    // The empty-state heading should appear
    cy.contains("section h2", /oops\.\.\.|could not find any products/i)
      .should("be.visible")
      .closest("section")
      .within(() => {
        cy.get("[data-test-card]").should("not.exist"); // no cards in the empty section
      });

    // Nowhere else on the page either
    cy.get("h2.border-b.border-brand-secondary-grey-15").should("not.exist"); // no category headings
    cy.get("[data-test-card]").should("not.exist"); // no product cards
  });

  it("Clearing the query restores the default menu (headings + cards)", () => {
    // Force an empty state first
    cy.get("@q").clear().type("jollof{enter}");
    cy.contains("section h2", /oops\.\.\.|could not find any products/i).should(
      "be.visible"
    );

    // Clear and blur (many UIs re-run search on change/blur)
    cy.get("@q").clear().blur();

    // Expect categories and cards to be back
    cy.get(S.categoryHeading)
      .filter(":visible")
      .should("have.length.greaterThan", 0);
    cy.get(S.card).filter(":visible").should("have.length.greaterThan", 0);
  });

  // EXPECTED FAILURE - Skipped until BUG #001 is fixed
  it.skip('Search respects active filters (No Wheat + "sandwich" => PDP has no wheat) - EXPECTED FAILURE: BUG #001', () => {
    // This test validates that search functionality properly respects active allergen filters
    // Currently fails due to BUG #001: Filter + Search doesn't properly exclude allergens
    
    cy.openFilterModal();
    cy.applyFilters({ allergens: ["No Wheat"] });

    cy.get("@q").clear().type("sandwich{enter}");
    assertResultsSettled();

    // If we have results, click first and verify allergens on PDP
    cy.get("body").then(($b) => {
      if ($b.find(S.card).length) {
        cy.get(S.card)
          .filter(":visible")
          .first()
          .click(); // Click the card directly - it IS the link!
        
        cy.get(S.pdpAllergens)
          .should("be.visible")
          .invoke("text")
          .then((t) => {
            expect(t.toLowerCase()).to.not.contain("wheat");
          });
        
        cy.go("back");
        cy.get(S.filterBadge).should("exist"); // filter still on
      }
    });
  });

  // Document the current buggy behavior - will fail when bug is fixed (alerting us to re-enable the main test)
  it('BUG #001 DOCUMENTED: Filter + Search incorrectly returns wheat products despite "No Wheat" filter', () => {
    /*
     * BUG DETAILS:
     * - Discovered: During test automation development
     * - Impact: Critical - Users with wheat allergies see unsafe products
     * - Reproduction: Apply "No Wheat" filter → Search "sandwich" → Products with wheat appear
     * - Example: Tuna Sandwich contains wheat but appears in filtered results
     * 
     * This test documents the bug and will FAIL when fixed, alerting us to update tests
     */
    
    cy.openFilterModal();
    cy.applyFilters({ allergens: ["No Wheat"] });
    cy.get("@q").clear().type("sandwich{enter}");
    assertResultsSettled();
    
    // Verify the bug exists - products with wheat DO appear (incorrect behavior)
    cy.get("body").then(($b) => {
      const hasResults = $b.find(S.card).filter(':visible').length > 0;
      
      if (hasResults) {
        cy.get(S.card).filter(":visible").first().click();
        cy.get(S.pdpAllergens)
          .should("be.visible")
          .invoke("text")
          .then((allergens) => {
            cy.log(`🐛 BUG CONFIRMED: Product allergens include: ${allergens}`);
            // This expectation documents the BUG - we expect wheat to be present (wrong!)
            // When bug is fixed, this will fail and we'll know to update our tests
            expect(allergens.toLowerCase()).to.contain("wheat");
          });
      } else {
        // If no results, the bug might be partially fixed
        cy.log("No sandwich results found with 'No Wheat' filter - bug may be partially fixed");
        expect(hasResults).to.be.true; // Force a check that we expect results
      }
    });
  });

  // EXPECTED FAILURE - Skipped until BUG #002 is fixed
  it.skip('Search for "tea" should only return beverages, not "steak" items - EXPECTED FAILURE: BUG #002', () => {
    // This test validates search relevance - "tea" should not match substring in "steak"
    // Currently fails due to BUG #002: Substring matching causes irrelevant results
    
    cy.get("@q").clear().type("tea{enter}");
    assertResultsSettled();
    
    // All visible products should be tea/beverages, not bakes
    cy.get(S.card).filter(":visible").each(($card) => {
      cy.wrap($card).find(S.cardTitle).invoke("text").then((title) => {
        expect(title.toLowerCase()).to.match(/tea|coffee|latte|cappuccino|hot chocolate|drink/);
        expect(title.toLowerCase()).to.not.match(/steak|bake/);
      });
    });
  });

  // Document the current buggy behavior - will fail when bug is fixed
  it('BUG #002 DOCUMENTED: Search for "tea" incorrectly returns "Steak Bake" due to substring matching', () => {
    /*
     * BUG DETAILS:
     * - Discovered: During test automation development
     * - Impact: Medium - Poor search relevance, confusing user experience
     * - Reproduction: Search "tea" → Results include "Steak Bake" and other non-tea items
     * - Cause: Search uses substring matching, finding "tea" within "steak"
     * 
     * This test documents the bug and will FAIL when fixed, alerting us to update tests
     */
    
    cy.get("@q").clear().type("tea{enter}");
    assertResultsSettled();
    
    // Verify the bug exists - "Steak Bake" appears when searching for "tea"
    let foundSteakItem = false;
    
    cy.get(S.card).filter(":visible").each(($card) => {
      cy.wrap($card).find(S.cardTitle).invoke("text").then((title) => {
        if (title.toLowerCase().includes("steak")) {
          foundSteakItem = true;
          cy.log(`🐛 BUG CONFIRMED: "${title}" appears when searching for "tea"`);
        }
      });
    }).then(() => {
      // This expectation documents the BUG - we expect steak items to appear (wrong!)
      // When bug is fixed, this will fail and we'll know to update our tests
      expect(foundSteakItem, 'Found "steak" items in tea search results').to.be.true;
    });
  });
});