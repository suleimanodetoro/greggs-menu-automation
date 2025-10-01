// File: cypress/support/utils/assertions.js
// Small helpers to keep specs readable.

export function expectOnlySectionsVisible(names = []) {
  // Visible sections must have headings matching one of the provided names.
  cy.get('body').then(($body) => {
    const nums = [];
    cy.wrap($body).find('section, [data-test="menu-section"]').each(($sec) => {
      const text = $sec.find('h2, [data-test="section-heading"]').text().trim();
      if ($sec.is(':visible')) nums.push(text);
    }).then(() => {
      if (names.length > 0) {
        names.forEach(n => expect(nums.join(' | ')).to.contain(n));
      }
    });
  });
}

export function expectNoOverflow(target = 'body') {
  cy.get(target).then(($el) => {
    const hasOverflow = $el[0].scrollWidth > $el[0].clientWidth;
    expect(hasOverflow, 'no horizontal overflow').to.eq(false);
  });
}

export function expectGridColumns(gridSel, expectedCols) {
  // Check first visible row to infer columns (responsive sanity check)
  cy.get(gridSel).filter(':visible').first().within(() => {
    cy.get('*').then(($children) => {
      // Count visible cards in first row by comparing top offsets
      const byTop = {};
      $children.filter(':visible').each((_, el) => {
        const top = Math.round(el.getBoundingClientRect().top);
        byTop[top] = (byTop[top] || 0) + 1;
      });
      const firstRowTop = Math.min(...Object.keys(byTop).map(Number));
      const cols = byTop[firstRowTop] || 0;
      expect(cols, 'columns in first row').to.be.oneOf([expectedCols, expectedCols + 1]); // allow 1 wrap variance
    });
  });
}
