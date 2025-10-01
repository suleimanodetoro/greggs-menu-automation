// cypress/e2e/menu/ui/responsive-modal.spec.js
// Part 4 of 7: Filter Modal Rendering

import { S } from '../../../support/utils/selectors';

const VIEWPORTS = {
  mobile: { width: 375, height: 667, name: 'Mobile (iPhone SE)' },
  tablet: { width: 768, height: 1024, name: 'Tablet (iPad Mini)' },
  desktop: { width: 1280, height: 720, name: 'Desktop' }
};

const RS = {
  modalCloseX: '[data-test-content] button[type="button"]:has(svg)',
};

const testAtViewports = (testName, testFn) => {
  Object.entries(VIEWPORTS).forEach(([key, { width, height, name }]) => {
    it(`${name}: ${testName}`, () => {
      cy.viewport(width, height);
      testFn({ key, width, height, name });
    });
  });
};

describe('Responsive UI – 4. Filter Modal Rendering', () => {
  
  
  testAtViewports('checkbox layout adapts to viewport', ({ key, width }) => {
    cy.visitMenu();
    cy.get(S.filterButton).click();
    
    cy.get('input[type="checkbox"]').should('exist');
    
    cy.get('label:has(input[type="checkbox"])').filter(':visible').then($labels => {
      if ($labels.length < 2) return;
      
      const positions = [...$labels].slice(0, 4).map(label => 
        label.getBoundingClientRect()
      );
      
      if (width < 768) {
        for (let i = 1; i < positions.length; i++) {
          expect(positions[i].top, 'Mobile checkboxes stacked').to.be.gt(positions[i-1].bottom - 10);
        }
      }
    });
    
    cy.get(S.filterBack).click();
  });
  
  
  testAtViewports('modal close button is accessible', ({ width }) => {
    cy.visitMenu();
    cy.get(S.filterButton).click();
    
    cy.get('body').then($body => {
      const closeBtn = $body.find(RS.modalCloseX).filter(':visible');
      
      if (closeBtn.length > 0) {
        cy.wrap(closeBtn).first().then($btn => {
          const btnRect = $btn[0].getBoundingClientRect();
          const modalRect = $btn.closest('[data-test-content]')[0].getBoundingClientRect();
          
          expect(btnRect.right, 'Close on right').to.be.gte(modalRect.right - 100);
          expect(btnRect.top, 'Close on top').to.be.lte(modalRect.top + 100);
          
          expect(btnRect.width, 'Close width').to.be.gte(24);
          expect(btnRect.height, 'Close height').to.be.gte(24);
        });
      }
    });
    
    cy.get(S.filterBack).click();
  });
  

});