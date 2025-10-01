# 🐛 Bugs Discovered During Testing

## Summary
During comprehensive testing of the Greggs menu section, **2 critical bugs** were identified that impact user experience and potentially safety.

---

## 🔴 BUG rgba(17, 0, 0, 1) 001: Filter + Search Fails to Exclude Allergens (CRITICAL)

### Severity: **CRITICAL - Safety Issue**
**Priority:** P0 - Immediate Fix Required

### Description
When combining allergen filters (e.g., "No Wheat") with search functionality, the system incorrectly returns products containing the filtered allergen.

### Steps to Reproduce
1. Navigate to /menu
2. Click "Filter" button
3. Select "No Wheat" allergen filter
4. Apply filters
5. Search for "sandwich"
6. Click any result and view allergen information

### Expected Result
Only products without wheat should appear in search results

### Actual Result
Products containing wheat (e.g., "Tuna Sandwich") appear in filtered search results

### Impact
- **User Safety Risk**: Users with wheat allergies/celiac disease could be shown unsafe products
- **Legal Risk**: Potential allergen disclosure violation
- **Trust Impact**: Damages brand credibility

### Evidence
- Test: `search.spec.js` line XX
- Screenshot: [if you have one]

### Recommendation
Implement server-side filter validation that applies BEFORE search logic

---

## 🟡 BUG #002: Search Substring Matching Returns Irrelevant Results (MEDIUM)

### Severity: **MEDIUM - UX Issue**
**Priority:** P2

### Description
Search uses naive substring matching, causing searches for "tea" to return "Steak Bake" (because "tea" exists in "steak")

### Steps to Reproduce
1. Navigate to /menu
2. Search for "tea"
3. Observe results

### Expected Result
Only tea-related beverages should appear

### Actual Result
Steak Bakes and other non-tea items appear in results

### Impact
- Poor search relevance
- Frustrating user experience
- Increased time to find products

### Evidence
- Test: `search.spec.js` line 171

### Recommendation
Implement word-boundary matching or token-based search algorithm

---

## Test Coverage for Bugs
Both bugs have:
- Reproducible test cases (skipped with `.skip()`)
- Documentation tests that PASS while bug exists (will FAIL when fixed, alerting team)
- Clear expected behavior defined