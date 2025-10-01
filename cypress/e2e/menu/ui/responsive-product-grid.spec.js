// cypress/e2e/menu/ui/responsive-product-grid.spec.js
// Part 3 of 7: Product Grid Responsiveness

import { S } from '../../../support/utils/selectors';

const VIEWPORTS = {
  mobile: { width: 375, height: 667, name: 'Mobile (iPhone SE)' },
  tablet: { width: 768, height: 1024, name: 'Tablet (iPad Mini)' },
  desktop: { width: 1280, height: 720, name: 'Desktop' }
};

const testAtViewports = (testName, testFn) => {
  Object.entries(VIEWPORTS).forEach(([key, { width, height, name }]) => {
    it(`${name}: ${testName}`, () => {
      cy.viewport(width, height);
      testFn({ key, width, height, name });
    });
  });
};

describe('Responsive UI – 3. Product Grid Responsiveness', () => {
  
  testAtViewports('product grid displays correct columns per row', ({ key, width }) => {
    cy.visitMenu();
    
    const expectedCols = width < 640 ? 2 : 4;
    
    cy.get(S.categoryHeading).first().parent().find('.grid').first().should('be.visible').within(() => {
      cy.get(S.card).should('have.length.gte', expectedCols).then($cards => {
        const positions = [...$cards].slice(0, expectedCols).map(card => 
          card.getBoundingClientRect()
        );
        
        const avgTop = positions.reduce((sum, pos) => sum + pos.top, 0) / positions.length;
        
        positions.forEach((pos, idx) => {
          expect(Math.abs(pos.top - avgTop), `Card ${idx} in row ${key}`).to.be.lt(10);
        });
      });
    });
  });
  
  testAtViewports('product cards maintain equal heights', ({ width }) => {
    cy.visitMenu();
    
    const expectedCols = width < 640 ? 2 : 4;
    
    cy.get(S.categoryHeading).first().parent().find('.grid').first().within(() => {
      cy.get(S.card).then($cards => {
        if ($cards.length < expectedCols) return;
        
        const heights = [...$cards].slice(0, expectedCols).map(card => 
          card.getBoundingClientRect().height
        );
        
        const avgHeight = heights.reduce((a, b) => a + b) / heights.length;
        
        heights.forEach((height, idx) => {
          expect(Math.abs(height - avgHeight), `Card ${idx} height`).to.be.lt(20);
        });
      });
    });
  });
  
  testAtViewports('product grid has consistent spacing', ({ width }) => {
    cy.visitMenu();
    
    const expectedCols = width < 640 ? 2 : 4;
    
    cy.get(S.categoryHeading).first().parent().find('.grid').first().within(() => {
      cy.get(S.card).then($cards => {
        if ($cards.length < expectedCols + 1) return;
        
        const positions = [...$cards].slice(0, expectedCols + 1).map(card => 
          card.getBoundingClientRect()
        );
        
        const gaps = [];
        for (let i = 1; i < positions.length; i++) {
          if (Math.abs(positions[i].top - positions[i-1].top) < 10) {
            gaps.push(positions[i].left - positions[i-1].right);
          }
        }
        
        if (gaps.length > 1) {
          const avgGap = gaps.reduce((a, b) => a + b) / gaps.length;
          
          gaps.forEach((gap, idx) => {
            expect(Math.abs(gap - avgGap), `Gap ${idx}`).to.be.lessThan(5);
          });
          
          expect(avgGap, 'Gap ~32px').to.be.within(28, 36);
        }
      });
    });
  });
  
  testAtViewports('product card images maintain aspect ratio', ({ width }) => {
    cy.visitMenu();
    
    cy.get(S.card).first().find('img').should('be.visible').then($img => {
      const rect = $img[0].getBoundingClientRect();
      const aspectRatio = rect.width / rect.height;
      
      expect(aspectRatio, 'Image aspect ~1:1').to.be.within(0.9, 1.1);
    });
  });
  
  it('Desktop: no card overlap in grid', () => {
    cy.viewport(1280, 720);
    cy.visitMenu();
    
    cy.get(S.categoryHeading).first().parent().find('.grid').first().within(() => {
      cy.get(S.card).then($cards => {
        const rects = [...$cards].slice(0, 8).map(card => card.getBoundingClientRect());
        
        for (let i = 0; i < rects.length; i++) {
          for (let j = i + 1; j < rects.length; j++) {
            const rect1 = rects[i];
            const rect2 = rects[j];
            
            const overlaps = !(
              rect1.right < rect2.left ||
              rect1.left > rect2.right ||
              rect1.bottom < rect2.top ||
              rect1.top > rect2.bottom
            );
            
            expect(overlaps, `Card ${i} and ${j} no overlap`).to.be.false;
          }
        }
      });
    });
  });
});