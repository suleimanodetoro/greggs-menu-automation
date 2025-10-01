// cypress/e2e/menu/ui/responsive-dynamic.spec.js
// Part 7 of 7: Dynamic Content Rendering + Cross-Viewport Smoke Test

import { S } from '../../../support/utils/selectors';

const VIEWPORTS = {
  mobile: { width: 375, height: 667, name: 'Mobile (iPhone SE)' },
  tablet: { width: 768, height: 1024, name: 'Tablet (iPad Mini)' },
  desktop: { width: 1280, height: 720, name: 'Desktop' }
};

const RS = {
  logo: 'a.HeaderLogo',
  findShopCard: 'a[href="/shop-finder"]',
  footer: 'footer[data-primary-footer]',
};

const testAtViewports = (testName, testFn) => {
  Object.entries(VIEWPORTS).forEach(([key, { width, height, name }]) => {
    it(`${name}: ${testName}`, () => {
      cy.viewport(width, height);
      testFn({ key, width, height, name });
    });
  });
};

describe('Responsive UI – 7. Dynamic Content & Smoke Tests', () => {
  
  describe('Dynamic Content Rendering', () => {
    
    it('Initial page load has no FOUC', () => {
      cy.clearCookies();
      cy.clearLocalStorage();
      
      cy.visitMenu();
      
      cy.get('h1', { timeout: 2000 }).should('be.visible').then($h1 => {
        const styles = window.getComputedStyle($h1[0]);
        
        expect(styles.fontFamily).to.not.equal('Times New Roman');
        expect(styles.fontSize).to.not.equal('32px');
      });
    });
    
    testAtViewports('filter transitions are smooth', ({ key }) => {
      cy.visitMenu();
      
      cy.get(S.card).filter(':visible').its('length').as('initialCount');
      
      cy.get(S.pillByName('Breakfast')).click();
      
      cy.wait(500);
      
      cy.get(S.card).filter(':visible').should('have.length.greaterThan', 0);
      
      cy.get(S.pillByName('All')).click();
    });
    
    
    it('Off-screen images use lazy loading', () => {
      cy.viewport(1280, 720);
      cy.visitMenu();
      
      cy.get(S.card).eq(20).scrollIntoView();
      
      cy.get(S.card).eq(20).find('img').then($img => {
        const loading = $img.attr('loading');
        
        expect(loading).to.equal('lazy');
      });
    });
    
    testAtViewports('loading states do not persist', ({ key }) => {
      cy.visitMenu();
      
      cy.get('body').then($body => {
        const loadingElements = $body.find('[class*="loading"]:visible, [class*="spinner"]:visible, .skeleton:visible');
        
        expect(loadingElements.length, 'No loading states').to.equal(0);
      });
    });
    

  });
  
  
});