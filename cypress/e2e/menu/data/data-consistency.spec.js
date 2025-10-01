// cypress/e2e/menu/data/data-consistency.spec.js
const forceLazyImages = () => {
  cy.window().then((win) => {
    win.IntersectionObserver = class {
      constructor(cb) { this.cb = cb; }
      observe(el) { this.cb([{ isIntersecting: true, target: el }]); }
      unobserve() {}
      disconnect() {}
    };
  });
};

describe('Data Consistency Tests', () => {
  
  beforeEach(() => {
    cy.visitWithConsent('/menu');
    cy.waitForPageLoad();
    forceLazyImages();
  });

  it('Filter badge count matches results - should show 2 for No Soya + calories', () => {
    // Open filter modal
    cy.get('[data-test="filterButton"]').click();
    cy.get('[data-test-content]').should('be.visible');
    
    // Select No Soya
    cy.contains('label', 'No Soya').find('input[type="checkbox"]').check();
    
    // Move slider to 2000
    cy.get('input.calories-slider')
      .invoke('val', 2000)
      .trigger('input')
      .trigger('change');
    
    // Apply filters
    cy.get('[data-test="modalApply"]').click();
    
    // Assert badge count == 2
    cy.get('[data-test="filterButton"] span.absolute')
      .should('be.visible')
      .and('contain', '2');
  });

  it('Zero-results accuracy - 0 calories + Breakfast should show Oops', () => {
    // Open modal
    cy.get('[data-test="filterButton"]').click();
    
    // Set 0 calories on slider
    cy.get('input.calories-slider')
      .invoke('val', 0)
      .trigger('input')
      .trigger('change');
    
    // Tick Breakfast
    cy.contains('label', 'Breakfast').find('input[type="checkbox"]').check();
    
    // Apply
    cy.get('[data-test="modalApply"]').click();
    
    // Assert "Oops" message
    cy.contains('Oops').should('be.visible');
  });

//   it('Counts update when data changes - Breakfast count matches products', () => {
//     let expectedCount;
    
//     // Open modal
//     cy.get('[data-test="filterButton"]').click();
    
//     // Note the count beside Breakfast (e.g., "Breakfast (20)")
//     cy.contains('label', 'Breakfast')
//       .find('span.text-brand-primary-blue')
//       .invoke('text')
//       .then((text) => {
//         expectedCount = parseInt(text.match(/\d+/)[0]);
//       });
    
//     // Select Breakfast
//     cy.contains('label', 'Breakfast').find('input[type="checkbox"]').check();
    
//     // Apply filters
//     cy.get('[data-test="modalApply"]').click();
    
//     // Count product cards
//     cy.get('[data-test-card]')
//       .should('have.length', expectedCount);
//   });

  it('Name parity - card title == detail page title', () => {
    let cardTitle;
    
    // Get card h3 value
    cy.get('[data-test-card] h3')
      .first()
      .invoke('text')
      .then((text) => {
        cardTitle = text.trim();
      });
    
    // Click the card
    cy.get('[data-test-card]').first().click();
    cy.waitForPageLoad();
    
    // Assert h1 on detail page matches
    cy.get('h1.text-brand-primary-blue')
      .invoke('text')
      .then((pdpTitle) => {
        expect(pdpTitle.trim().toLowerCase())
          .to.equal(cardTitle.toLowerCase());
      });
  });

// Replace ONLY the "Image parity - card image src == detail page image src" test
// in cypress/e2e/menu/data/data-consistency.spec.js with this:

// Replace your existing "Image parity" test with this:

it('Image parity - PDP image corresponds to clicked card (id / filename normalized)', () => {
  const resolvedSrc = ($img) => {
    const el = $img[0];
    return (el && (el.currentSrc || el.src)) ? (el.currentSrc || el.src) : '';
  };

  // extract numeric product id (e.g. 1000714) from any of the URL parts
  const extractId = (url = '') => {
    const m = String(url).match(/(\d{5,})(?=[^0-9]*\.(?:png|jpe?g|webp)|[^0-9]*$)/i);
    return m ? m[1] : null;
  };

  // normalize filename to ignore -thumb and querystrings
  const normalizedName = (url = '') => {
    try {
      const u = new URL(url, window.location.origin);
      const fname = u.pathname.split('/').pop() || '';
      // strip query/hash, strip '-thumb' before extension
      return fname.replace(/-thumb(?=\.(png|jpe?g|webp|gif|avif)$)/i, '').toLowerCase();
    } catch {
      const fname = url.split('?')[0].split('#')[0].split('/').pop() || '';
      return fname.replace(/-thumb(?=\.(png|jpe?g|webp|gif|avif)$)/i, '').toLowerCase();
    }
  };

  // --- 1) capture card data -------------------------------------------------
  cy.get('[data-test-card]').first().as('firstCard');

  // card title (to target the correct PDP image)
  cy.get('@firstCard').find('h3').invoke('text').then(t => cy.wrap(t.trim()).as('cardTitle'));

  // card image URL + id
  cy.get('@firstCard').find('img').first().then(($img) => {
    const cardUrl = resolvedSrc($img);
    expect(cardUrl, 'card image resolved URL').to.not.equal('');
    cy.wrap(cardUrl).as('cardSrc');
    cy.wrap(extractId(cardUrl)).as('cardId');
  });

  // --- 2) go to PDP ---------------------------------------------------------
  cy.get('@firstCard').click();
  cy.waitForPageLoad();

  // re-stub IO on PDP so lazy imgs resolve (Nuxt image / IO)
  cy.window().then((win) => {
    win.IntersectionObserver = class {
      constructor(cb) { this.cb = cb; }
      observe(el) { this.cb([{ isIntersecting: true, target: el }]); }
      unobserve() {}
      disconnect() {}
    };
  });

  // PDP title
  cy.get('h1.text-brand-primary-blue').invoke('text').then(t => cy.wrap(t.trim()).as('pdpTitle'));

  // some galleries are opacity:0 at lg; if so, drop to tablet
  cy.get('body').then(($b) => {
    const hidden = $b.find('ul.lg\\:opacity-0').length > 0;
    if (hidden) cy.viewport(768, 1024);
  });

  // --- 3) pick the correct PDP image (match ALT to PDP title) ---------------
  cy.get('@pdpTitle').then((title) => {
    const titleLc = String(title).toLowerCase();
    cy.get('picture[data-component="MediaPicture"] img[alt]').then(($imgs) => {
      const arr = Array.from($imgs);
      const exact = arr.find(img => (img.getAttribute('alt') || '').trim().toLowerCase() === titleLc);
      const contains = arr.find(img => (img.getAttribute('alt') || '').toLowerCase().includes(titleLc));
      const chosen = exact || contains || arr[0];
      expect(chosen, 'found PDP product image candidate').to.exist;
      cy.wrap(chosen).as('pdpImg');
    });
  });

  // --- 4) compare by id / normalized filename -------------------------------
  cy.get('@pdpImg').then(($img) => {
    const pdpUrl = resolvedSrc($img);
    expect(pdpUrl, 'pdp image resolved URL').to.not.equal('');
    expect($img[0].naturalWidth, 'pdp image actually loaded').to.be.greaterThan(0);

    cy.get('@cardSrc').then((cardUrl) => {
      const cardId = extractId(cardUrl);
      const pdpId  = extractId(pdpUrl);

      if (cardId && pdpId) {
        expect(pdpId, 'product id parity').to.equal(cardId);
      } else {
        // Fallback: compare normalized filenames (ignoring -thumb and queries)
        const cardName = normalizedName(cardUrl);
        const pdpName  = normalizedName(pdpUrl);
        expect(pdpName, 'normalized filename parity').to.equal(cardName);
      }
    });

    // final sanity: alt should include PDP title
    cy.get('@pdpTitle').then((title) => {
      expect(($img.attr('alt') || '').toLowerCase(), 'alt matches title').to.include(String(title).toLowerCase());
    });
  });
});





  it('Calorie <= 1900 filter - products respect limit', () => {
    // Open modal
    cy.get('[data-test="filterButton"]').click();
    
    // Set calorie slider to 1900
    cy.get('input.calories-slider')
      .invoke('val', 1900)
      .trigger('input')
      .trigger('change');
    
    // Apply filter
    cy.get('[data-test="modalApply"]').click();
    
    // Click any product card
    cy.get('[data-test-card]').first().click();
    cy.waitForPageLoad();
    
    // Get calories from table (e.g., "1583kJ")
    cy.get('td.text-blue-grey.text-center')
      .contains(/\d+kJ/)
      .invoke('text')
      .then((calorieText) => {
        // Convert string to number
        const kJ = parseInt(calorieText.match(/\d+/)[0]);
        const kcal = Math.round(kJ / 4.184);
        
        // Assert value <= 1900
        expect(kcal).to.be.at.most(1900);
      });
  });

  it('Allergen exclusion - No Wheat + Sandwiches should exclude wheat', () => {
    // Open filter modal
    cy.get('[data-test="filterButton"]').click();
    
    // Tick "No Wheat"
    cy.contains('label', 'No Wheat').find('input[type="checkbox"]').check();
    
    // Tick "Sandwiches & Salads"
    cy.contains('label', 'Sandwiches & Salads').find('input[type="checkbox"]').check();
    
    // Apply filters
    cy.get('[data-test="modalApply"]').click();
    
    // Click any product (if exists)
    cy.get('[data-test-card]').then(($cards) => {
      if ($cards.length > 0) {
        cy.wrap($cards.first()).click();
        cy.waitForPageLoad();
        
        // Check allergens span (e.g., "Eggs, Wheat, Milk")
        cy.get('body').then(($body) => {
          const allergenSpan = $body.find('span:contains("Allergens:") + span');
          if (allergenSpan.length > 0) {
            cy.wrap(allergenSpan)
              .invoke('text')
              .then((allergenText) => {
                // Assert wheat word isn't there (known bug - some products may fail)
                expect(allergenText.toLowerCase()).to.not.include('wheat');
              });
          }
        });
      }
    });
  });

});