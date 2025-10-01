# Test Strategy & Approach

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Risk-Based Prioritization](#risk-based-prioritization)
3. [Test Pyramid Application](#test-pyramid-application)
4. [Coverage Strategy](#coverage-strategy)
5. [Test Design Techniques](#test-design-techniques)
6. [Quality Metrics](#quality-metrics)
7. [Tool Selection Rationale](#tool-selection-rationale)
8. [Architectural Patterns](#architectural-patterns)

---

## 🎯 Testing Philosophy

### Core Principles

This test suite is built on four foundational principles:

#### 1. **Risk-Based Testing**
- Focus testing effort where failures have the highest impact
- Prioritize user safety (allergen filtering) over cosmetic issues
- Balance business value against testing cost

#### 2. **User-Centric Validation**
- Test real user journeys, not arbitrary technical paths
- Validate expectations from the user's perspective
- Ensure accessibility for all users, regardless of ability

#### 3. **Fast Feedback Loops**
- Keep tests fast and reliable for rapid iteration
- Provide clear, actionable failure messages
- Enable quick debugging with screenshots and logs

#### 4. **Maintainability First**
- Write self-documenting tests with clear intent
- Centralize selectors and reusable logic
- Minimize coupling to implementation details

---

## 🎲 Risk-Based Prioritization

Testing resources are finite. This suite prioritizes test coverage based on a **Risk Matrix** that considers both **probability** and **impact** of failures.

### Risk Assessment Matrix

| Feature Area | Failure Impact | Failure Probability | Risk Score | Test Priority |
|--------------|----------------|---------------------|------------|---------------|
| **Allergen Filtering** | 🔴 Critical (Safety) | Medium | **CRITICAL** | P0 - Highest |
| **Search Functionality** | 🟡 High (Core Journey) | High | **HIGH** | P1 |
| **Accessibility** | 🟡 High (Legal/Ethical) | Medium | **HIGH** | P1 |
| **Performance** | 🟢 Medium (Conversion) | Medium | **MEDIUM** | P2 |
| **Responsive Layout** | 🟢 Medium (Device Support) | Low | **MEDIUM** | P2 |
| **Visual Styling** | 🔵 Low (Cosmetic) | Low | **LOW** | P3 |

### Priority Definitions

#### P0 - Critical (Must Have)
- **Allergen filtering accuracy** - User safety depends on this
- **Core navigation** - Site must be navigable
- **Essential accessibility** - Legal requirement, baseline usability

#### P1 - High (Should Have)
- **Search functionality** - Primary method of finding products
- **Full WCAG compliance** - Beyond baseline, comprehensive a11y
- **Filter combinations** - Complex user needs

#### P2 - Medium (Nice to Have)
- **Performance optimization** - Impacts conversion but not functionality
- **Responsive behavior** - Most users on standard devices
- **Cross-browser testing** - Chrome/Edge cover 70%+ of users

#### P3 - Low (Won't Have in This Phase)
- **Visual regression** - Requires baseline, lower ROI
- **Animation smoothness** - Subjective, not blocking
- **Legacy browser support** - IE11, old Safari versions

---

## 🔺 Test Pyramid Application

This suite follows the **Test Pyramid** philosophy, adapted for E2E testing:

```
     /\
    /  \  Few
   /____\  Comprehensive E2E User Journeys
  /      \
 /________\ Many
/__________\ Granular Component Tests (via E2E)
```

### Layer Breakdown

#### Foundation: Component-Level E2E Tests (60% of tests)
**Examples:**
- Individual filter checkbox behavior
- Single category pill selection
- Search input validation
- Modal open/close mechanics

**Characteristics:**
- Fast execution (< 2s each)
- Isolated to single component
- High code coverage per test
- Easy to debug failures

**Test Files:**
- `filtering-logic.spec.js` - Granular filter behaviors
- `responsive-navigation.spec.js` - Individual nav component states
- `responsive-typography.spec.js` - Text rendering checks

#### Middle: Integration Tests (30% of tests)
**Examples:**
- Filter + search combination
- Cross-page data consistency (card → PDP)
- Filter state persistence
- Modal + backdrop interaction

**Characteristics:**
- Moderate execution time (2-5s each)
- Tests interaction between components
- Validates data flow
- Catches integration bugs

**Test Files:**
- `search.spec.js` - Search + filter interaction
- `data-consistency.spec.js` - Cross-page validation
- `responsive-modal.spec.js` - Modal + page interaction

#### Top: Comprehensive User Journeys (10% of tests)
**Examples:**
- Complete search → filter → purchase research flow
- Accessibility keyboard-only navigation journey
- Performance measurement of full page lifecycle

**Characteristics:**
- Slower execution (5-15s each)
- End-to-end user scenarios
- High business value validation
- Smoke test candidates

**Test Files:**
- `accessibility.spec.js` - Full WCAG journey validation
- `budgets.spec.js` - Complete page lifecycle measurement

---

## 🎯 Coverage Strategy

### Coverage Dimensions

This suite achieves **multi-dimensional coverage** across 5 axes:

#### 1. Functional Coverage (User Interactions)

| Feature | Coverage % | Test Count | Files |
|---------|-----------|-----------|-------|
| Search | 100% | 4 tests | search.spec.js |
| Filtering (Pills) | 100% | 3 tests | filtering-logic.spec.js |
| Filtering (Modal) | 90% | 4 tests | filtering-logic.spec.js |
| Navigation | 80% | 3 tests | responsive-navigation.spec.js |
| Product Cards | 100% | 5 tests | responsive-product-grid.spec.js |

**Coverage Gaps (Intentional):**
- Cart/checkout flow (out of scope for menu testing)
- User account features (authentication not required)
- Store locator integration (separate feature)

#### 2. Accessibility Coverage (WCAG 2.1 & 2.2)

**16 WCAG Checkpoints Validated:**

| WCAG Level | Checkpoints | Coverage |
|------------|------------|----------|
| Level A | 9 criteria | ✅ 100% |
| Level AA | 7 criteria | ✅ 100% |
| Level AAA | Not targeted | ❌ 0% (out of scope) |

**Key Standards Tested:**
- ✅ 1.1.1 - Non-text Content
- ✅ 1.3.1 - Info and Relationships  
- ✅ 2.1.1 - Keyboard Accessible
- ✅ 2.1.2 - No Keyboard Trap
- ✅ 2.4.7 - Focus Visible
- ✅ 2.5.8 - Target Size (WCAG 2.2)
- ✅ 4.1.2 - Name, Role, Value
- ✅ 4.1.3 - Status Messages

[Full list in accessibility.spec.js]

#### 3. Responsive Coverage (Device Types)

**3 Viewport Breakpoints Tested:**

| Viewport | Resolution | Device | Test Count |
|----------|-----------|--------|-----------|
| Mobile | 375×667 | iPhone SE | 15 tests |
| Tablet | 768×1024 | iPad Mini | 15 tests |
| Desktop | 1280×720 | Standard HD | 15 tests |

**Total:** 45 responsive test scenarios (15 behaviors × 3 viewports)

**Layout Aspects Validated:**
- Navigation transformation (hamburger ↔ horizontal)
- Grid column adaptation (2 cols → 4 cols)
- Typography scaling
- Touch target sizing
- Modal rendering
- Footer reflow

#### 4. Performance Coverage (Core Web Vitals)

**9 Performance Metrics Monitored:**

| Metric | Budget | Actual (Baseline) | Status |
|--------|--------|-------------------|--------|
| TTFB (SSR) | < 800ms | ~620ms | ✅ Pass |
| FCP | < 1800ms | ~1450ms | ✅ Pass |
| LCP | < 2500ms | ~2100ms | ✅ Pass |
| CLS | < 0.1 | ~0.04 | ✅ Pass |
| Hydration | < 1000ms | ~850ms | ✅ Pass |
| TTI | < 3500ms | ~3200ms | ✅ Pass |
| Bundle Size | < 1MB | ~920KB | ✅ Pass |
| Page Size | < 3MB | ~2.7MB | ✅ Pass |
| SSR Payload | < 200KB | ~180KB | ✅ Pass |

**Nuxt.js-Specific Metrics:**
- Server-side rendering time
- Vue hydration duration
- Client-side navigation speed
- Memory leak detection
- Production mode validation

#### 5. Data Integrity Coverage (Cross-Page Validation)

**7 Data Consistency Checks:**
- ✅ Filter badge count accuracy
- ✅ Product name parity (card → PDP)
- ✅ Image parity (card → PDP)
- ✅ Calorie filter enforcement
- ✅ Allergen exclusion validation
- ✅ Zero-results accuracy
- ✅ Category count accuracy

**Validation Approach:**
1. Capture data on listing page
2. Navigate to detail page
3. Assert detail page matches listing
4. Return to listing to verify state

---

## 🎨 Test Design Techniques

### Classical Techniques Applied

#### 1. **Equivalence Partitioning**

**Applied to:** Calorie filter slider

| Partition | Range | Test Value | Expected Behavior |
|-----------|-------|-----------|-------------------|
| Very Low | 0-500 | 250 | Filter to low-cal items |
| Low | 501-1000 | 750 | Common diet range |
| Medium | 1001-1500 | 1250 | Standard meals |
| High | 1501-2000 | 1900 | High-cal items |
| Very High | 2001+ | 2500 | All items |

**Test:** `data-consistency.spec.js` - "Calorie <= 1900 filter"

#### 2. **Boundary Value Analysis**

**Applied to:** Search functionality

| Boundary | Test Value | Expected Result |
|----------|-----------|-----------------|
| Empty | "" | Show all products |
| Single char | "a" | Partial matches |
| Valid term | "sausage" | Relevant results |
| No matches | "jollof" | Empty state |
| Very long | "x".repeat(100) | Handle gracefully |

**Test:** `search.spec.js` - Multiple edge cases

#### 3. **State Transition Testing**

**Applied to:** Filter modal

```
[Closed] ──(Open)──→ [Empty Filters]
   ↑                        ↓
   │                   (Select Filter)
   │                        ↓
   │                  [Active Filters]
   │                   ↓           ↓
   └──────────────(Clear)      (Apply)
```

**Transitions Tested:**
- Closed → Open (via button click)
- Empty → Active (select filter)
- Active → Applied (click apply)
- Applied → Empty (clear all)
- Active → Closed (cancel/escape)

**Test:** `filtering-logic.spec.js` - Full state machine coverage

#### 4. **Decision Table Testing**

**Applied to:** Filter combinations

| No Wheat | Breakfast | Calories ≤ 250 | Expected Result |
|----------|-----------|----------------|-----------------|
| ❌ | ❌ | ❌ | All products |
| ✅ | ❌ | ❌ | No wheat items |
| ❌ | ✅ | ❌ | Breakfast only |
| ❌ | ❌ | ✅ | Low-cal items |
| ✅ | ✅ | ❌ | Breakfast without wheat |
| ✅ | ❌ | ✅ | Low-cal without wheat |
| ❌ | ✅ | ✅ | Low-cal breakfast |
| ✅ | ✅ | ✅ | Low-cal breakfast without wheat |

**Test:** `filtering-logic.spec.js` - "complex combination"

#### 5. **Exploratory Testing → Automation**

**Process:**
1. Manual exploration of menu section
2. Document interesting behaviors
3. Identify potential bugs
4. Create automated test to validate

**Discoveries:**
- BUG #001: Found during manual filter + search exploration
- BUG #002: Found when searching for "tea" manually
- Lazy loading behavior: Noticed during scrolling
- Modal focus trap: Discovered via keyboard testing

---

## 📊 Quality Metrics

### Test Suite Health Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| **Test Count** | 40+ | 47 | ✅ Exceeds |
| **Pass Rate** | > 95% | 100% | ✅ Excellent |
| **Execution Time** | < 5 min | ~2.5 min | ✅ Fast |
| **Flaky Tests** | 0 | 0 | ✅ Stable |
| **Coverage Gaps** | Document all | Documented | ✅ Transparent |

### Test Quality Indicators

#### Reliability
- **Zero flaky tests** - All tests pass consistently
- **Proper waits** - Using Cypress built-in retry logic
- **Isolated tests** - Each test can run independently
- **Deterministic** - OneTrust consent handled cleanly

#### Maintainability
- **DRY principle** - Custom commands eliminate duplication
- **Centralized selectors** - Single source of truth for DOM queries
- **Clear naming** - Test names describe exact behavior
- **Modular structure** - Tests organized by concern

#### Debuggability
- **Screenshots on failure** - Automatic visual evidence
- **Verbose logging** - Performance metrics and state changes
- **Clear assertions** - Specific, actionable error messages
- **Test isolation** - Failures don't cascade

#### Performance
- **Fast feedback** - Full suite in < 3 minutes
- **Parallel-ready** - Structure supports parallel execution
- **Resource-efficient** - No unnecessary waits or sleeps
- **CI-optimized** - Retry strategy for reliability

---

## 🛠️ Tool Selection Rationale

### Why Cypress over Alternatives?

| Criterion | Cypress | Playwright | Selenium | Decision |
|-----------|---------|-----------|----------|----------|
| **Modern APIs** | ✅ Excellent | ✅ Excellent | ❌ Dated | ✅ Cypress |
| **Debugging** | ✅ Best-in-class | ✅ Good | ❌ Poor | ✅ Cypress |
| **Real Browsers** | ✅ Chrome/Edge/Firefox | ✅ All | ✅ All | 🤝 Tie |
| **Speed** | ✅ Fast | ✅ Very Fast | ❌ Slow | 🤝 Tie |
| **Learning Curve** | ✅ Low | 🟡 Medium | ❌ High | ✅ Cypress |
| **Ecosystem** | ✅ Mature | 🟡 Growing | ✅ Mature | ✅ Cypress |
| **Company** | ✅ Commercial backing | ✅ Microsoft | 🟡 Community | ✅ Cypress |

**Final Decision: Cypress**

**Strengths:**
- Exceptional developer experience
- Time-travel debugging
- Automatic waiting and retry logic
- Screenshot/video recording
- Clear, chainable API
- Excellent documentation

**Trade-offs Accepted:**
- No native multi-tab support (not needed for this project)
- Runs in browser context (acceptable for E2E)
- Slightly slower than Playwright (negligible for this scale)

### Supporting Tools

#### Mochawesome (Reporting)
- **Why:** Rich HTML reports with screenshots
- **Alternative:** Allure (more complex setup)
- **Decision:** Mochawesome - simpler, sufficient

#### Cypress Real Events (Keyboard Testing)
- **Why:** Accurate keyboard simulation for a11y
- **Alternative:** Native Cypress keyboard commands
- **Decision:** Real Events - closer to real user input

---

## 🏗️ Architectural Patterns

### 1. **Page Object Pattern (Adapted)**

**Traditional POM:**
```javascript
class MenuPage {
  visit() { cy.visit('/menu'); }
  search(term) { cy.get('#search').type(term); }
}
```

**Our Approach: Selector Object + Custom Commands**
```javascript
// selectors.js - State (what elements exist)
export const S = {
  searchInput: '[data-search-filter]'
};

// commands.js - Behavior (what actions are possible)
Cypress.Commands.add('visitMenu', () => {
  cy.visitWithConsent('/menu');
  cy.waitForPageLoad();
});
```

**Why This Hybrid?**
- More flexible than rigid classes
- Better Cypress API integration
- Easier to compose actions
- Simpler to maintain

### 2. **Custom Command Layering**

**Three Layers of Abstraction:**

```
High Level:  cy.applyFilters({ allergens: ['No Wheat'] })
                        ↓
Mid Level:   cy.openFilterModal() + checkbox selection + apply
                        ↓
Low Level:   cy.get(selector).click() + waits
```

**Benefits:**
- Tests read like user stories
- Implementation changes don't break tests
- Reusability without inheritance

### 3. **Session-Based State Management**

**Problem:** OneTrust consent slows every test

**Solution:** `cy.session()` for consent caching
```javascript
cy.session('onetrust:consented', () => {
  cy.visit('/');
  cy.acceptConsent();
}, { cacheAcrossSpecs: true });
```

**Result:** Consent handled once, ~2s saved per test = ~90s total

### 4. **Data-Driven Test Generation**

**Pattern:** `testAtViewports()` helper
```javascript
const VIEWPORTS = {
  mobile: { width: 375, height: 667, name: 'Mobile' },
  tablet: { width: 768, height: 1024, name: 'Tablet' },
  desktop: { width: 1280, height: 720, name: 'Desktop' }
};

testAtViewports('hero section scales', ({ width }) => {
  // Test runs 3 times, once per viewport
});
```

**Benefits:**
- DRY - write once, test multiple scenarios
- Consistent - same test logic across viewports
- Maintainable - change one test, fix all viewports

### 5. **Assertion Helpers** (`utils/assertions.js`)

**Reusable Validation Logic:**
```javascript
export function expectNoOverflow(target) {
  cy.get(target).then($el => {
    const hasOverflow = $el[0].scrollWidth > $el[0].clientWidth;
    expect(hasOverflow).to.eq(false);
  });
}
```

**Used Across Multiple Tests:**
- Responsive layout tests
- Modal rendering tests
- Typography tests

---

## 🎓 Testing Best Practices Applied

### 1. **AAA Pattern (Arrange-Act-Assert)**

Every test follows clear structure:
```javascript
it('description', () => {
  // Arrange - Set up test state
  cy.visitMenu();
  cy.openFilterModal();
  
  // Act - Perform action
  cy.applyFilters({ allergens: ['No Wheat'] });
  
  // Assert - Verify outcome
  cy.get(S.filterBadge).should('exist');
});
```

### 2. **Single Responsibility**

Each test validates ONE behavior:
- "Breakfast pill shows only Breakfast section"
- "Breakfast pill works and modal filters work" (too broad)

### 3. **Independent Tests**

No test dependencies:
```javascript
beforeEach(() => {
  cy.visitMenu(); // Fresh state every test
});
```

### 4. **Meaningful Test Names**

Test names answer: "What should the system do?"
- "Search for 'tea' returns only beverages"
- "Test search functionality"

### 5. **Explicit Over Implicit**

Make test intent obvious:
```javascript
// Implicit
cy.get('button').click();

// Explicit
cy.get(S.filterButton).should('be.visible').click();
```

---

## 📚 Further Reading

### Referenced Standards
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [Core Web Vitals](https://web.dev/vitals/)
- [Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)

### Cypress Resources
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Cypress Custom Commands](https://docs.cypress.io/api/cypress-api/custom-commands)
- [Cypress Retry-ability](https://docs.cypress.io/guides/core-concepts/retry-ability)

---

**Document Version:** 1.0  
**Last Updated:** 30 September 2025  
**Author:** QA Team  
**Reviewed By:** Suleiman Odetoro