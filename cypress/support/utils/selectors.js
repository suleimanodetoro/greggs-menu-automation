// cypress/support/utils/selectors.js
export const S = {
  // Navbar / hamburger
  nav: 'nav, [data-test="nav"]',
  navToggle:
    '[data-test="nav-toggle"], button[aria-controls], [aria-label*="menu"]',
  navList: '[data-test="nav-list"], nav ul, [role="menu"]',

  // Search (your real DOM)
  searchBar: '#searchbar',
  searchInput: '[data-search-filter]',

  // Filter Pills
  pillByName: (name) => `[data-test-filter="${name}"]`,
  pillsWrap: '[data-test="category-pills"]',

  // Filter Modal
  filterButton: '[data-test="filterButton"]',
  filterModal: '[data-test-content]',
  filterApply: '[data-test="modalApply"]',
  filterClear: '[data-test="modalClear"]',
  filterBack: '[data-test="modalCancel"]',
  filterBadge: '[data-test="filterButton"] span.absolute',
  caloriesSlider: 'input.calories-slider',

  // Menu content
  section: 'section',
  categoryHeading: 'h2.border-b.border-brand-secondary-grey-15',
  grid: '.grid', // the grid div inside each category section
  card: '[data-test-card]', // anchors have this attribute
  cardTitle: 'h3',
  cardLink: 'a[href*="/menu/product/"]',

  // PDP
  pdpTitle: '[data-test="pdp-title"], h1', //there's no such thing as pdp-title so get creative targeting the title (example: <h1 class="text-brand-primary-blue lg:mt-15 leading-sm mb-8 mt-8 px-5 text-center text-5xl lg:col-span-3 lg:col-start-1 lg:mb-0 lg:px-0 lg:text-left lg:text-8xl">Small Still Water</h1>)
  pdpAllergens:
    '[data-test-nutrition="allergens"], [data-test="allergens"], [aria-label*="allergen" i]',
  pdpCalories:
    '[data-test="calories"], [aria-label*="calorie" i], [class*="calorie"]',
};
