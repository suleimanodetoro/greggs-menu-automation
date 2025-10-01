// cypress/e2e/menu/ui/responsive-typography.spec.js
// Part 5 of 7: Typography & Icon Consistency

import { S } from '../../../support/utils/selectors';

const VIEWPORTS = {
  mobile: { width: 375, height: 667, name: 'Mobile (iPhone SE)' },
  tablet: { width: 768, height: 1024, name: 'Tablet (iPad Mini)' },
  desktop: { width: 1280, height: 720, name: 'Desktop' }
};

const RS = {
  heroTitle: '.HeroProContent__title h1',
  hamburger: 'button[data-component="HeaderSwitch"]',
};

const testAtViewports = (testName, testFn) => {
  Object.entries(VIEWPORTS).forEach(([key, { width, height, name }]) => {
    it(`${name}: ${testName}`, () => {
      cy.viewport(width, height);
      testFn({ key, width, height, name });
    });
  });
};

describe('Responsive UI – 5. Typography & Icon Consistency', () => {
  
  
  
  testAtViewports('icons render correctly', ({ key }) => {
    cy.visitMenu();
    
    cy.get(S.filterButton).find('svg').should('be.visible');
    
    if (key === 'mobile') {
      cy.get(RS.hamburger).should('be.visible');
    }
  });
  
  testAtViewports('product cards have name and image', ({ key }) => {
    cy.visitMenu();
    
    cy.get(S.card).first().within(() => {
      cy.get('img').should('exist').and('be.visible').and(($img) => {
        const alt = $img.attr('alt');
        expect(alt, 'Image has alt').to.exist.and.not.be.empty;
      });
      
      cy.get('h3').should('exist').and('be.visible').and(($h3) => {
        const text = $h3.text().trim();
        expect(text, 'Card has name').to.not.be.empty;
      });
    });
  });
  
  testAtViewports('filter pill text does not overflow', ({ key }) => {
    cy.visitMenu();
    
    cy.get('[data-test-filter]').each($pill => {
      const textContent = $pill.text().trim();
      
      expect(textContent).to.not.be.empty;
      
      const isOverflowing = $pill[0].scrollWidth > $pill[0].clientWidth;
      
      expect(isOverflowing, `"${textContent}" no overflow`).to.be.false;
    });
  });
  
  
});