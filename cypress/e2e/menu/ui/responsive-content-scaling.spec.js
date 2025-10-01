// cypress/e2e/menu/ui/responsive-content-scaling.spec.js
// Part 2 of 7: Content Scaling & Reflow

import { S } from '../../../support/utils/selectors';

const VIEWPORTS = {
  mobile: { width: 375, height: 667, name: 'Mobile (iPhone SE)' },
  tablet: { width: 768, height: 1024, name: 'Tablet (iPad Mini)' },
  desktop: { width: 1280, height: 720, name: 'Desktop' }
};

const RS = {
  hero: '[data-component="HeroPro"]',
  heroTitle: '.HeroProContent__title h1',
  pillContainer: '[data-component="PillFilters"]',
  findShopCard: '.col-span-2 > .mx-auto.max-w-3xl > a[href="/shop-finder"]',
  clickCollectCard: '.col-span-2 > .mx-auto.max-w-3xl > a[href="/click-and-collect"]',
  deliveryCard: '.col-span-2 > .mx-auto.max-w-3xl > a[href="/order/delivery"]',
  appCard: '.col-span-2 > .mx-auto.max-w-3xl > a[href="/app"]',
  featureCard: '[data-component="FeatureCard"]',
  featureImage: '[data-component="FeatureCard"] img',
  featureButtons: '[data-component="FeatureCard"] a',
  footer: 'footer[data-primary-footer]',
  footerColumns: 'footer ul[data-test="footerNavWrapper"]',
  footerSocial: '[data-component="SocialLinks"]',
};

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

const testAtViewports = (testName, testFn) => {
  Object.entries(VIEWPORTS).forEach(([key, { width, height, name }]) => {
    it(`${name}: ${testName}`, () => {
      cy.viewport(width, height);
      testFn({ key, width, height, name });
    });
  });
};

describe('Responsive UI – 2. Content Scaling & Reflow', () => {
  
  testAtViewports('hero section text scales proportionally', ({ width }) => {
    cy.visitMenu();
    forceLazyImages();
    
    cy.get(RS.hero).should('be.visible');
    cy.get(RS.heroTitle).should('be.visible').then($title => {
      const text = $title.text();
      expect(text.trim()).to.not.be.empty;
      
      const titleRect = $title[0].getBoundingClientRect();
      const parentRect = $title[0].parentElement.getBoundingClientRect();
      expect(titleRect.width, 'Title does not overflow').to.be.lte(parentRect.width + 10);
      
      const fontSize = parseFloat(window.getComputedStyle($title[0]).fontSize);
      
      if (width < 640) {
        expect(fontSize, 'Mobile font size').to.be.within(24, 60);
      } else if (width < 1024) {
        expect(fontSize, 'Tablet font size').to.be.within(32, 72);
      } else {
        expect(fontSize, 'Desktop font size').to.be.within(40, 90);
      }
    });
  });
  
  testAtViewports('search box remains usable', ({ key }) => {
    cy.visitMenu();
    forceLazyImages();
    
    cy.get(S.searchBar).should('be.visible');
    cy.get(S.searchInput).should('be.visible').then($input => {
      const rect = $input[0].getBoundingClientRect();
      
      expect(rect.height, 'Search input height').to.be.gte(40);
      expect(rect.width, 'Search input width').to.be.gte(200);
      
      if (key === 'mobile') {
        const bodyWidth = Cypress.$('body').width();
        expect(rect.width, 'Mobile search full width').to.be.gte(bodyWidth * 0.8);
      }
    });
  });
  
  testAtViewports('filter section layout is correct', () => {
    cy.visitMenu();
    forceLazyImages();
    
    cy.get(S.filterButton).should('be.visible').then($btn => {
      const rect = $btn[0].getBoundingClientRect();
      expect(rect.width, 'Filter button width').to.be.gte(48);
      expect(rect.height, 'Filter button height').to.be.gte(48);
    });
    
    cy.get(RS.pillContainer).should('be.visible');
    
    cy.get(RS.pillContainer).within(() => {
      cy.get('button[data-test-filter]').then($pills => {
        if ($pills.length < 2) return;
        
        const first = $pills[0].getBoundingClientRect();
        const second = $pills[1].getBoundingClientRect();
        
        expect(second.left, 'Pills horizontal').to.be.gt(first.left);
        expect(Math.abs(second.top - first.top), 'Pills aligned').to.be.lt(10);
      });
    });
  });
  
  testAtViewports('4-card services section layout adapts', ({ key }) => {
    cy.visitMenu();
    forceLazyImages();
    
    cy.get(RS.findShopCard).scrollIntoView().should('be.visible');
    cy.get(RS.clickCollectCard).should('be.visible');
    cy.get(RS.deliveryCard).should('be.visible');
    cy.get(RS.appCard).should('be.visible');
    
    const cards = [RS.findShopCard, RS.clickCollectCard, RS.deliveryCard, RS.appCard];
    
    cy.wrap(cards).then(() => {
      const positions = cards.map(sel => Cypress.$(sel)[0].getBoundingClientRect());
      
      if (key === 'mobile') {
        for (let i = 1; i < positions.length; i++) {
          expect(positions[i].top, `Card ${i} below card ${i-1}`).to.be.gt(positions[i-1].bottom - 20);
        }
      } else {
        expect(Math.abs(positions[0].top - positions[1].top), 'Row 1').to.be.lt(10);
        expect(Math.abs(positions[2].top - positions[3].top), 'Row 2').to.be.lt(10);
        expect(positions[2].top, 'Rows stacked').to.be.gt(positions[0].bottom - 20);
      }
    });
  });
  
  testAtViewports('feature card maintains layout', () => {
    cy.visitMenu();
    forceLazyImages();
    
    cy.get(RS.featureCard).scrollIntoView().should('be.visible');
    
    cy.get(RS.featureImage).should('be.visible').and(($img) => {
      expect($img[0].naturalWidth, 'Image loaded').to.be.greaterThan(0);
    });
    
    cy.get(RS.featureButtons).should('have.length', 2).then($btns => {
      const first = $btns[0].getBoundingClientRect();
      const second = $btns[1].getBoundingClientRect();
      
      const overlaps = !(
        first.right < second.left ||
        first.left > second.right ||
        first.bottom < second.top ||
        first.top > second.bottom
      );
      
      expect(overlaps, 'Buttons do not overlap').to.be.false;
    });
  });
  
  testAtViewports('footer layout adapts correctly', ({ width }) => {
    cy.visitMenu();
    forceLazyImages();
    
    cy.get(RS.footer).scrollIntoView().should('be.visible');
    cy.get(RS.footerSocial).should('be.visible');
    
    cy.get(RS.footerColumns).should('have.length', 4).then($columns => {
      const positions = [...$columns].map(col => col.getBoundingClientRect());
      
      if (width < 768) {
        for (let i = 1; i < positions.length; i++) {
          expect(positions[i].top, 'Mobile stacked').to.be.gt(positions[i-1].bottom - 20);
        }
      } else {
        const avgTop = positions.reduce((sum, pos) => sum + pos.top, 0) / positions.length;
        
        positions.forEach((pos, idx) => {
          expect(Math.abs(pos.top - avgTop), `Column ${idx} aligned`).to.be.lt(50);
        });
        
        for (let i = 1; i < positions.length; i++) {
          expect(positions[i].left, `Column ${i} right of ${i-1}`).to.be.gt(positions[i-1].left);
        }
      }
    });
  });
});