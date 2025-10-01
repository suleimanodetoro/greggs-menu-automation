# Future Improvements & Enhancement Roadmap

## 📋 Overview

This document outlines potential enhancements to the test automation suite, organized by priority and effort. While the current implementation provides comprehensive coverage, these improvements would further strengthen quality assurance and streamline the testing process.

---

## 🎯 Categorized Improvements

### Legend
- **Priority:** P0 (Critical) → P3 (Nice to Have)
- **Effort:** 🟢 Low (< 1 day) | 🟡 Medium (1-3 days) | 🔴 High (1+ week)
- **ROI:** Return on Investment - Impact vs. Effort

---

## 🚀 High Priority, High ROI

### 1. Visual Regression Testing

**Priority:** P1  
**Effort:** 🟡 Medium (2-3 days)  
**ROI:** ⭐⭐⭐⭐⭐ Excellent

#### Current State
- Framework setup exists in `cypress.config.js` with `saveJson` and `loadJson` tasks
- `cypress/visual-baselines/` directory structure prepared
- No baseline images captured yet

#### Implementation Plan
```javascript
// Already have the infrastructure:
cy.task('saveJson', {
  filename: 'cypress/visual-baselines/menu-desktop.json',
  data: layoutMetrics
});
```

#### Benefits
- Catch unintended UI regressions automatically
- Prevent pixel-pushing bugs from reaching production
- Validate responsive layout changes
- Complement structural tests with visual validation

#### Recommended Tools
1. **Percy** (Preferred)
   - Cloud-based visual testing
   - Automatic baseline management
   - Responsive screenshot comparison
   - Integrates with Cypress
   - Free tier: 5,000 screenshots/month

2. **Applitools Eyes** (Alternative)
   - AI-powered visual validation
   - More sophisticated matching algorithms
   - Higher cost

3. **Cypress Image Snapshot** (Budget Option)
   - Local pixel-diff testing
   - No cloud dependency
   - Requires manual baseline management

#### Implementation Steps
1. Choose tool (recommend Percy for ease + ROI)
2. Capture baseline images for all viewports
3. Add visual test spec: `cypress/e2e/menu/visual/regression.spec.js`
4. Integrate into CI/CD pipeline
5. Define acceptable diff thresholds

#### Example Test
```javascript
describe('Visual Regression', () => {
  it('Menu page matches baseline (desktop)', () => {
    cy.visitMenu();
    cy.viewport(1280, 720);
    cy.percySnapshot('Menu - Desktop');
  });
});
```

---

### 2. CI/CD Pipeline Integration

**Priority:** P1  
**Effort:** 🟡 Medium (1-2 days)  
**ROI:** ⭐⭐⭐⭐⭐ Excellent

#### Current State
- GitHub Actions workflow exists but is **outdated** (`cypress.yml`)
- Manual test execution only
- No automated deployment validation

#### What Needs Updating
```yaml
# Current: Outdated syntax and paths
# Need: Modern workflow with proper matrix strategy

name: Cypress E2E Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 8 * * *'  # Daily at 8 AM UTC

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chrome, edge, firefox]
        viewport: [mobile, tablet, desktop]
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:${{ matrix.browser }} -- --config viewportWidth=${{ matrix.viewport.width }}
      
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: cypress-${{ matrix.browser }}-${{ matrix.viewport }}
          path: cypress/screenshots
```

#### Benefits
- Automated regression testing on every PR
- Multi-browser validation without manual effort
- Scheduled smoke tests catch production issues early
- Parallel execution speeds up feedback
- Artifact storage for debugging failures

#### Additional CI Features
- **Slack notifications** for test failures
- **PR comments** with test results summary
- **Coverage reports** integrated with GitHub
- **Performance trend tracking** over time

---

### 3. API Layer Testing

**Priority:** P1  
**Effort:** 🟡 Medium (2-3 days)  
**ROI:** ⭐⭐⭐⭐ High

#### Current Gap
- Only testing through UI
- No direct API validation
- Backend changes could break silently

#### Proposed Approach

**Create:** `cypress/e2e/api/` directory

**Tests:**
```javascript
describe('Menu API', () => {
  it('GET /api/menu returns valid product data', () => {
    cy.request('/api/menu').then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('products');
      
      // Validate schema
      response.body.products.forEach(product => {
        expect(product).to.have.all.keys(
          'id', 'name', 'category', 'allergens', 'calories'
        );
      });
    });
  });
  
  it('POST /api/menu/search with allergen filter excludes wheat', () => {
    cy.request('POST', '/api/menu/search', {
      query: 'sandwich',
      filters: { allergens: ['No Wheat'] }
    }).then((response) => {
      response.body.results.forEach(product => {
        expect(product.allergens).to.not.include('Wheat');
      });
    });
  });
});
```

#### Benefits
- Faster feedback (no UI rendering wait)
- Isolate backend bugs from frontend issues
- Better debugging (clearer error messages)
- Test edge cases difficult to reach via UI
- Validate BUG #001 at API level

---

## 🎨 Medium Priority, Good ROI

### 4. Enhanced Accessibility Testing

**Priority:** P2  
**Effort:** 🟢 Low (1 day)  
**ROI:** ⭐⭐⭐⭐ High

#### Current State
- Manual WCAG validation (16 checkpoints)
- No automated accessibility scanning

#### Proposed Enhancement

**Add:** `axe-core` integration

```javascript
// cypress/support/e2e.js
import 'cypress-axe';

describe('Accessibility - Automated Scan', () => {
  it('Menu page has no detectable a11y violations', () => {
    cy.visitMenu();
    cy.injectAxe();
    cy.checkA11y(null, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']
      }
    });
  });
});
```

#### Benefits
- Catch additional a11y issues (color contrast, etc.)
- Faster than manual checking
- Comprehensive rule set (90+ checks)
- Standard industry tool (Deque)

#### Complementary Tool

**Add:** `pa11y-ci` for CLI accessibility audits

```bash
npm run a11y:audit  # Runs pa11y on all pages
```

---

### 5. Cross-Browser Testing Matrix

**Priority:** P2  
**Effort:** 🟡 Medium (1-2 days)  
**ROI:** ⭐⭐⭐ Medium

#### Current State
- Primary: Chrome (Chromium)
- Secondary: Edge (tested manually)
- Firefox: Supported by Cypress config but not automated
- Safari: Not tested

#### Proposed Matrix

| Browser | Version | OS | Priority |
|---------|---------|----|----|
| Chrome | Latest | Linux/macOS/Windows | ✅ P1 |
| Edge | Latest | Windows | ✅ P1 |
| Firefox | Latest | Linux/macOS | 🟡 P2 |
| Safari | Latest | macOS | 🟢 P3 |

#### Implementation
```json
// package.json - add scripts
"test:matrix": "npm run test:chrome && npm run test:firefox && npm run test:edge"
```

#### Known Challenges
- **Safari:** Cypress support requires WebKit, more complex setup
- **Browser differences:** May need browser-specific selectors
- **CI cost:** More browsers = longer pipeline time

#### ROI Analysis
- Chrome/Edge cover ~70% of users → Already covered
- Firefox adds ~8% coverage → Medium value
- Safari adds ~15% (mainly mobile) → Lower priority (mobile Safari different from desktop)

**Recommendation:** Add Firefox next, defer Safari until mobile testing is prioritized

---

### 6. Performance Trend Tracking

**Priority:** P2  
**Effort:** 🟡 Medium (2-3 days)  
**ROI:** ⭐⭐⭐ Medium

#### Current State
- Performance metrics captured per run
- No historical comparison
- Saved to `cypress/reports/performance-latest.json`

#### Proposed Enhancement

**Create:** Performance dashboard with trend analysis

**Storage Options:**
1. **CSV File** (Simple)
   ```javascript
   // Append to cypress/reports/performance-history.csv
   timestamp,ttfb,fcp,lcp,cls,hydration
   2025-01-15,623,1450,2100,0.04,847
   ```

2. **SQLite Database** (Better)
   ```sql
   CREATE TABLE performance_metrics (
     id INTEGER PRIMARY KEY,
     timestamp DATETIME,
     commit_sha TEXT,
     ttfb INTEGER,
     fcp INTEGER,
     lcp INTEGER,
     cls REAL,
     ...
   );
   ```

3. **Cloud Service** (Best)
   - **Grafana Cloud** (free tier)
   - **Datadog** (expensive)
   - **Custom dashboard** (Netlify + Chart.js)

#### Visualization
```javascript
// scripts/visualize-performance.js
const data = loadPerformanceHistory();
const chart = new Chart('performance-trend', {
  type: 'line',
  data: {
    labels: data.dates,
    datasets: [
      { label: 'TTFB', data: data.ttfb },
      { label: 'FCP', data: data.fcp }
    ]
  }
});
```

#### Benefits
- Detect performance regressions over time
- Correlate changes to specific commits
- Justify performance optimization work
- Monitor improvement after fixes

---

## 🔧 Lower Priority, Nice to Have

### 7. Component-Level Contract Tests

**Priority:** P3  
**Effort:** 🔴 High (1+ week)  
**ROI:** ⭐⭐ Low (for E2E suite)

#### Description
Create component-level tests for Vue components in isolation (outside of Cypress).

#### Tools
- **Vitest** + **Vue Test Utils**
- **@testing-library/vue**

#### Example
```javascript
import { mount } from '@vue/test-utils';
import ProductCard from '@/components/ProductCard.vue';

test('ProductCard renders name and image', () => {
  const wrapper = mount(ProductCard, {
    props: {
      product: { name: 'Sausage Roll', image: '/img.jpg' }
    }
  });
  
  expect(wrapper.find('h3').text()).toBe('Sausage Roll');
  expect(wrapper.find('img').attributes('src')).toBe('/img.jpg');
});
```

#### Why Lower Priority
- E2E tests already cover component rendering
- Greggs codebase not accessible (can't test components)
- Best suited for library/framework maintainers
- Higher maintenance cost (test environment setup)

#### When to Consider
- If building internal component library
- If component complexity increases significantly
- If team size grows and specialization increases

---

### 8. Mobile Device Testing (Real Devices)

**Priority:** P3  
**Effort:** 🔴 High (ongoing cost)  
**ROI:** ⭐⭐ Low (viewport testing sufficient)

#### Current State
- Viewport emulation (375×667, 768×1024)
- Simulates mobile layout
- No real device testing

#### Proposed Enhancement

**Tool:** BrowserStack or Sauce Labs

```javascript
// cypress.config.js
{
  browserstackLocal: true,
  browsers: [
    { device: 'iPhone 14 Pro', os: 'iOS', os_version: '16' },
    { device: 'Samsung Galaxy S22', os: 'Android', os_version: '12' }
  ]
}
```

#### Why Lower Priority
- Viewport testing covers layout issues (80% of mobile bugs)
- Real device bugs (Safari iOS quirks, Android Chrome) are rare
- High cost (~$200/month for device cloud)
- Greggs likely has internal device lab

#### When to Consider
- Mobile-specific bugs found in production
- Touch gesture testing required
- Native app wrapper testing needed

---

### 9. Load & Stress Testing

**Priority:** P3  
**Effort:** 🔴 High (1+ week)  
**ROI:** ⭐ Very Low (for functional suite)

#### Description
Test system behavior under high load.

#### Tools
- **k6** (modern, scriptable)
- **Artillery** (YAML config)
- **JMeter** (legacy, UI-based)

#### Example Scenario
```javascript
// k6 script
import http from 'k6/http';

export let options = {
  stages: [
    { duration: '5m', target: 100 },  // Ramp to 100 users
    { duration: '10m', target: 100 }, // Stay at 100
    { duration: '5m', target: 0 }     // Ramp down
  ]
};

export default function () {
  http.get('https://www.greggs.com/menu');
  http.post('https://www.greggs.com/api/menu/search', {
    query: 'sausage'
  });
}
```

#### Why Lowest Priority
- Out of scope for E2E functional testing
- Requires production-like infrastructure
- Performance testing (budgets.spec.js) covers single-user perf
- Load testing is infrastructure/ops concern

#### When to Consider
- Pre-launch of major features
- Black Friday / high-traffic events
- Suspected scalability issues

---

## 📊 Implementation Roadmap

### Phase 1: Quick Wins (Week 1)
- ✅ **Enhance Accessibility** - Add axe-core (1 day)
- ✅ **Update CI/CD Pipeline** - Fix GitHub Actions (1 day)

**Impact:** Automated a11y scanning + PR validation

### Phase 2: High-Value Additions (Week 2-3)
- ✅ **Visual Regression** - Set up Percy (2 days)
- ✅ **API Testing Layer** - Create API spec suite (2-3 days)
- ✅ **Firefox Browser** - Add to test matrix (1 day)

**Impact:** Comprehensive visual + API coverage

### Phase 3: Optimization (Week 4)
- ✅ **Performance Trends** - Build tracking system (2-3 days)
- ✅ **Parallel Execution** - Optimize CI for speed (1 day)

**Impact:** Faster feedback, better insights

### Phase 4: Future Considerations (Backlog)
- 🔮 Mobile device testing (if budget allows)
- 🔮 Component-level tests (if codebase access)
- 🔮 Load testing (coordinate with ops)

---

## 🎯 Prioritization Framework

### When Evaluating New Tests

Ask these questions:

1. **Risk:** What's the impact if this fails?
   - Critical → P0
   - High → P1
   - Medium → P2
   - Low → P3

2. **Probability:** How likely is this to fail?
   - Common → +1 priority level
   - Rare → -1 priority level

3. **Cost:** How much effort to implement?
   - Low effort + high value = Do now
   - High effort + low value = Defer

4. **Maintenance:** How much upkeep?
   - Low maintenance = Better ROI
   - High maintenance = Consider carefully

### Decision Matrix

|  | High Value | Low Value |
|--|-----------|----------|
| **Low Effort** | ✅ Do First | 🟡 Do Later |
| **High Effort** | 🟡 Plan Carefully | ❌ Don't Do |

---

## 🚫 Deliberately NOT Implemented

### Things We Considered and Rejected

#### 1. Screenshot Comparison for Every Test
**Why Not:** Too brittle, high false-positive rate
**Better:** Targeted visual regression with Percy

#### 2. Testing Every Browser Version (IE11, old Safari)
**Why Not:** Legacy support not in scope, diminishing returns
**Better:** Focus on modern browsers (last 2 versions)

#### 3. Testing Email Notifications
**Why Not:** Out of scope for menu section
**Better:** Separate notification test suite (if needed)

#### 4. Monkey Testing / Chaos Engineering
**Why Not:** Low ROI for this application type
**Better:** Structured exploratory testing + automation

#### 5. Full Redux/Vuex State Testing
**Why Not:** Can't access Greggs codebase internals
**Better:** Test state through UI behavior

---

## 📝 Technical Debt Acknowledgments

### Known Limitations We're Living With

#### 1. Selector Fragility
**Issue:** Some selectors rely on CSS classes (e.g., `.border-b.border-brand-secondary-grey-15`)
**Impact:** Could break if design changes
**Mitigation:** Most use `data-test` attributes
**Future:** Advocate for more data attributes in codebase

#### 2. No Page Object Classes
**Issue:** Using selector object + commands instead of full POM
**Impact:** Less IDE autocomplete, more manual imports
**Mitigation:** Well-documented selector object
**Future:** Evaluate if team grows and POM becomes valuable

#### 3. OneTrust Dependency
**Issue:** Tests rely on OneTrust SDK being present
**Impact:** If CMP changes, tests break
**Mitigation:** Clean API usage, fallback to button click
**Future:** Mock CMP in test environment?

#### 4. Performance Baselines Are Local
**Issue:** Performance metrics vary by machine
**Impact:** Can't compare across environments reliably
**Mitigation:** Run on consistent CI machines
**Future:** Lighthouse CI integration with fixed lab environment

#### 5. No Authentication Testing
**Issue:** Can't test logged-in user experiences
**Impact:** Coverage gap for personalized features
**Mitigation:** Not required for public menu browsing
**Future:** Add auth tests if user features expand

---

## 🎓 Lessons Learned & Best Practices

### What Worked Well

✅ **Risk-Based Prioritization**
- Testing allergen filtering first found critical BUG #001
- High-impact areas got most attention

✅ **Clean Consent Handling**
- OneTrust API usage > DOM hacks
- Session caching saved ~90 seconds total runtime

✅ **Modular Test Structure**
- Easy to find specific test types
- Clear separation of concerns
- Supports team collaboration

### What We'd Do Differently Next Time

🔄 **Capture Visual Baselines Earlier**
- Framework was ready but baselines not captured
- Should have been in initial scope

🔄 **API Tests from Day 1**
- Would have isolated BUG #001 faster
- Easier to debug backend issues

🔄 **More Exploratory Testing Documentation**
- Some bugs found manually but not documented
- Should have test ideas log from exploration phase

---

## 📚 Resources for Implementation

### Tools & Services
- [Percy Visual Testing](https://percy.io/)
- [axe-core Accessibility](https://github.com/dequelabs/axe-core)
- [Cypress Dashboard](https://www.cypress.io/dashboard)
- [GitHub Actions](https://docs.github.com/en/actions)
- [k6 Load Testing](https://k6.io/)

### Learning Resources
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Web.dev Performance](https://web.dev/performance/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Test Automation Patterns](https://testautomationpatterns.org/)

---

## 🤝 Contributing Future Improvements

If you implement any of these improvements:

1. **Update this document** - Mark as completed, add actual effort
2. **Document lessons learned** - What worked? What didn't?
3. **Update main README** - Reflect new capabilities
4. **Add example output** - Show what good looks like
5. **Share knowledge** - Write blog post / internal wiki

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Next Review:** February 2025  
**Maintained By:** QA Team