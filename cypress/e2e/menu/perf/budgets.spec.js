// cypress/e2e/menu/performance/budgets.spec.js
// Performance Testing Suite - Nuxt.js / Vue SSR Optimized
// Tests hydration, client-side navigation, and SSR-specific metrics

import { S } from "../../../support/utils/selectors";

const PERFORMANCE_BUDGETS = {
  // Initial Load (SSR + Hydration)
  serverResponse: 800, // TTFB for SSR
  htmlParsing: 500, // DOM parsing time
  hydrationTime: 1000, // Vue taking over from SSR
  timeToInteractive: 3500, // When user can interact

  // Navigation (SPA-style after initial load)
  clientNavigation: 300, // Route change performance

  // Standard Web Vitals
  firstContentfulPaint: 1800,
  largestContentfulPaint: 2500,
  cumulativeLayoutShift: 0.1,

  // Resource Sizes
  totalPageSize: 3 * 1024 * 1024, // 3MB
  ssrPayloadSize: 200 * 1024, // 200KB for Nuxt payload
  totalImageSize: 2 * 1024 * 1024, // 2MB
  totalScriptSize: 1 * 1024 * 1024, // 1MB (Nuxt apps are JS-heavy)
  totalStyleSize: 200 * 1024, // 200KB

  // Resource Counts
  maxImages: 50,
  maxScripts: 20, // Nuxt generates many chunks
  maxStylesheets: 10,

  // DOM Metrics
  maxDOMNodes: 1500,
  maxDOMDepth: 15,

  // Nuxt-specific
  maxVueComponents: 50, // Number of Vue component instances
  maxHydrationMismatches: 0, // SSR/client mismatches
};

const forceLazyImages = () => {
  cy.window().then((win) => {
    win.IntersectionObserver = class {
      constructor(cb) {
        this.cb = cb;
      }
      observe(el) {
        this.cb([{ isIntersecting: true, target: el }]);
      }
      unobserve() {}
      disconnect() {}
    };
  });
};

const waitForHydration = () => {
  // Wait for Nuxt to hydrate (Vue takes over from SSR)
  cy.window().then((win) => {
    // Check if Vue/Nuxt app is mounted
    return new Promise((resolve) => {
      const checkHydration = () => {
        // Nuxt sets this when hydration completes
        if (win.$nuxt || win.__NUXT__) {
          resolve();
        } else {
          setTimeout(checkHydration, 50);
        }
      };
      checkHydration();
    });
  });
};

describe("Menu – Performance & Resource Budgets (Nuxt.js Optimized)", () => {
  beforeEach(() => {
    cy.visitWithConsent("/menu");
    cy.waitForPageLoad();
  });

  describe("1. SSR & Hydration Performance", () => {
    it("Time to First Byte (TTFB) is fast", () => {
      cy.window().then((win) => {
        const perfData = win.performance.timing;
        const ttfb = perfData.responseStart - perfData.navigationStart;

        cy.logMetric("Time to First Byte (SSR)", `${ttfb}ms`);
        expect(ttfb, "TTFB for SSR page").to.be.lessThan(
          PERFORMANCE_BUDGETS.serverResponse
        );
      });
    });

    it("HTML parsing time is acceptable", () => {
      cy.window().then((win) => {
        const perfData = win.performance.timing;
        const parseTime = perfData.domInteractive - perfData.domLoading;

        cy.logMetric("HTML Parsing Time", `${parseTime}ms`);
        expect(parseTime, "HTML parsing").to.be.lessThan(
          PERFORMANCE_BUDGETS.htmlParsing
        );
      });
    });

    it("Hydration completes quickly", () => {
      const hydrationStart = performance.now();

      waitForHydration();

      cy.window().then((win) => {
        const hydrationTime = performance.now() - hydrationStart;

        cy.logMetric("Hydration Time", `${Math.round(hydrationTime)}ms`);
        expect(hydrationTime, "Vue hydration time").to.be.lessThan(
          PERFORMANCE_BUDGETS.hydrationTime
        );
      });
    });

    it("No hydration mismatches in console", () => {
      const errors = [];

      cy.window().then((win) => {
        const originalError = win.console.error;
        win.console.error = (...args) => {
          const msg = args.join(" ");
          if (msg.includes("hydrat") || msg.includes("mismatch")) {
            errors.push(msg);
          }
          originalError.apply(win.console, args);
        };
      });

      // Wait for hydration
      cy.wait(2000);

      cy.wrap(errors).should(
        "have.length",
        PERFORMANCE_BUDGETS.maxHydrationMismatches
      );
    });

    it("Time to Interactive meets budget", () => {
      cy.window()
        .then((win) => {
          return new Promise((resolve) => {
            if (!win.PerformanceObserver) {
              cy.log("⚠️ PerformanceObserver not supported");
              resolve(null);
              return;
            }

            let tti = 0;
            const observer = new win.PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                if (entry.name === "interactive") {
                  tti = entry.startTime;
                }
              }
            });

            try {
              observer.observe({ entryTypes: ["measure"] });
              setTimeout(() => {
                observer.disconnect();
                resolve(tti);
              }, 4000);
            } catch (e) {
              resolve(null);
            }
          });
        })
        .then((tti) => {
          if (tti) {
            cy.logMetric("Time to Interactive", `${Math.round(tti)}ms`);
            expect(tti, "TTI").to.be.lessThan(
              PERFORMANCE_BUDGETS.timeToInteractive
            );
          }
        });
    });
  });

  describe("2. Client-Side Navigation Performance (SPA)", () => {
    it("Category filter navigation is instant (no page reload)", () => {
      waitForHydration();

      const start = performance.now();

      // This should be instant SPA navigation, not full page reload
      cy.get(S.pillByName("Breakfast")).click();
      cy.get(S.card).filter(":visible").should("have.length.greaterThan", 0);

      const duration = performance.now() - start;

      cy.logMetric("Client-Side Filter", `${duration.toFixed(2)}ms`);
      expect(duration, "SPA navigation").to.be.lessThan(
        PERFORMANCE_BUDGETS.clientNavigation
      );

      // Verify no page reload occurred
      cy.window().then((win) => {
        const navigationEntries =
          win.performance.getEntriesByType("navigation");
        expect(navigationEntries.length, "No page reload").to.equal(1);
      });
    });
  });

  describe("3. Nuxt Payload & Bundle Size", () => {
    it("SSR payload size is reasonable", () => {
      cy.window().then((win) => {
        // Nuxt sends data in __NUXT__ or __NUXT_DATA__
        const nuxtData = win.__NUXT__ || win.__NUXT_DATA__ || {};
        const payloadSize = JSON.stringify(nuxtData).length;

        const sizeKB = (payloadSize / 1024).toFixed(2);
        const budgetKB = (PERFORMANCE_BUDGETS.ssrPayloadSize / 1024).toFixed(2);

        cy.logMetric("Nuxt SSR Payload", `${sizeKB}KB`);
        cy.log(`Budget: ${budgetKB}KB`);

        expect(payloadSize, "SSR payload size").to.be.lessThan(
          PERFORMANCE_BUDGETS.ssrPayloadSize
        );
      });
    });

    it("JavaScript bundle size is within budget", () => {
      cy.window().then((win) => {
        const resources = win.performance.getEntriesByType("resource");

        // Nuxt creates many chunks: app.js, vendors.js, pages/menu.js, etc.
        const scriptResources = resources.filter(
          (r) => r.initiatorType === "script" || /\.js(\?|$)/i.test(r.name)
        );

        const totalScriptSize = scriptResources.reduce((sum, script) => {
          return sum + (script.transferSize || 0);
        }, 0);

        const totalKB = (totalScriptSize / 1024).toFixed(2);
        const budgetKB = (PERFORMANCE_BUDGETS.totalScriptSize / 1024).toFixed(
          2
        );

        cy.logMetric(
          "Total JS Size",
          `${totalKB}KB (${scriptResources.length} files)`
        );
        cy.log(`Budget: ${budgetKB}KB`);
        cy.log(`Nuxt apps are JS-heavy due to Vue framework + hydration`);

        expect(totalScriptSize, "Total script size").to.be.lessThan(
          PERFORMANCE_BUDGETS.totalScriptSize
        );
      });
    });

    it("CSS is efficiently split and loaded", () => {
      cy.window().then((win) => {
        const resources = win.performance.getEntriesByType("resource");
        const styleResources = resources.filter(
          (r) => r.initiatorType === "link" && /\.css(\?|$)/i.test(r.name)
        );

        const totalStyleSize = styleResources.reduce((sum, style) => {
          return sum + (style.transferSize || 0);
        }, 0);

        const totalKB = (totalStyleSize / 1024).toFixed(2);

        cy.logMetric(
          "Total CSS Size",
          `${totalKB}KB (${styleResources.length} files)`
        );

        expect(totalStyleSize, "Total CSS size").to.be.lessThan(
          PERFORMANCE_BUDGETS.totalStyleSize
        );
      });
    });
  });

  describe("4. Vue Component Performance", () => {
    it("Vue component count is reasonable", () => {
      waitForHydration();

      cy.window().then((win) => {
        // Try to count Vue component instances
        let componentCount = 0;

        if (win.$nuxt && win.$nuxt.$children) {
          const countComponents = (component) => {
            componentCount++;
            if (component.$children) {
              component.$children.forEach(countComponents);
            }
          };
          countComponents(win.$nuxt);
        } else {
          // Fallback: count elements with Vue data attributes
          componentCount = Cypress.$("[data-v-]").length;
        }

        cy.logMetric("Vue Components", componentCount);

        expect(componentCount, "Component instances").to.be.lessThan(
          PERFORMANCE_BUDGETS.maxVueComponents
        );
      });
    });

    it("Vue devtools not enabled in production", () => {
      cy.window().then((win) => {
        const hook = win.__VUE_DEVTOOLS_GLOBAL_HOOK__;
        // true only if the hook exists AND explicitly says enabled === true
        const enabled = !!(hook && hook.enabled === true);

        // In prod we expect devtools to NOT be enabled; either missing or disabled is OK
        expect(enabled, "Vue devtools enabled").to.equal(false);
      });
    });
  });

  describe("6. Core Web Vitals", () => {
    it("First Contentful Paint is within budget", () => {
      cy.window().then((win) => {
        const perfEntries = win.performance.getEntriesByType("paint");
        const fcp = perfEntries.find(
          (entry) => entry.name === "first-contentful-paint"
        );

        if (fcp) {
          cy.logMetric(
            "First Contentful Paint",
            `${Math.round(fcp.startTime)}ms`
          );
          expect(fcp.startTime, "FCP").to.be.lessThan(
            PERFORMANCE_BUDGETS.firstContentfulPaint
          );
        } else {
          cy.log("⚠️ FCP metric not available in this browser");
        }
      });
    });

    it("Largest Contentful Paint is within budget", () => {
      cy.window()
        .then((win) => {
          return new Promise((resolve) => {
            if (!win.PerformanceObserver) {
              cy.log("⚠️ PerformanceObserver not supported");
              resolve(null);
              return;
            }

            let largestPaint = 0;
            const observer = new win.PerformanceObserver((list) => {
              const entries = list.getEntries();
              entries.forEach((entry) => {
                if (entry.startTime > largestPaint) {
                  largestPaint = entry.startTime;
                }
              });
            });

            try {
              observer.observe({ entryTypes: ["largest-contentful-paint"] });
              setTimeout(() => {
                observer.disconnect();
                resolve(largestPaint);
              }, 3000);
            } catch (e) {
              cy.log("⚠️ LCP observation failed");
              resolve(null);
            }
          });
        })
        .then((lcp) => {
          if (lcp) {
            cy.logMetric("Largest Contentful Paint", `${Math.round(lcp)}ms`);
            expect(lcp, "LCP").to.be.lessThan(
              PERFORMANCE_BUDGETS.largestContentfulPaint
            );
          }
        });
    });

    it("Cumulative Layout Shift is minimal", () => {
      cy.window()
        .then((win) => {
          return new Promise((resolve) => {
            if (!win.PerformanceObserver) {
              cy.log("⚠️ PerformanceObserver not supported");
              resolve(null);
              return;
            }

            let clsValue = 0;
            const observer = new win.PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                  clsValue += entry.value;
                }
              }
            });

            try {
              observer.observe({ type: "layout-shift", buffered: true });
              setTimeout(() => {
                observer.disconnect();
                resolve(clsValue);
              }, 3000);
            } catch (e) {
              cy.log("⚠️ CLS observation failed");
              resolve(null);
            }
          });
        })
        .then((cls) => {
          if (cls !== null) {
            cy.logMetric("Cumulative Layout Shift", cls.toFixed(3));
            cy.log("SSR should help prevent layout shifts");
            expect(cls, "CLS").to.be.lessThan(
              PERFORMANCE_BUDGETS.cumulativeLayoutShift
            );
          }
        });
    });
  });

  describe("7. Resource Loading Strategy", () => {
    it("Critical resources are preloaded", () => {
      cy.document().then((doc) => {
        const preloadLinks = doc.querySelectorAll('link[rel="preload"]');
        const preconnectLinks = doc.querySelectorAll('link[rel="preconnect"]');

        cy.logMetric("Preload Links", preloadLinks.length);
        cy.logMetric("Preconnect Links", preconnectLinks.length);

        // Nuxt should preload critical chunks
        expect(
          preloadLinks.length,
          "Critical resources preloaded"
        ).to.be.greaterThan(0);
      });
    });

    it("Resources are cached appropriately", () => {
      cy.visitWithConsent("/menu");
      cy.waitForPageLoad();

      cy.window().then((win) => {
        const resources = win.performance.getEntriesByType("resource");
        const initialCount = resources.length;

        cy.reload();
        cy.waitForPageLoad();

        cy.window().then((win2) => {
          const resourcesAfter = win2.performance.getEntriesByType("resource");
          const cachedResources = resourcesAfter.filter(
            (r) => r.transferSize === 0 && r.decodedBodySize > 0
          );

          const cacheHitRate = (
            (cachedResources.length / initialCount) *
            100
          ).toFixed(1);

          cy.logMetric("Cache Hit Rate", `${cacheHitRate}%`);

          // Nuxt should cache JS chunks aggressively
          expect(
            cachedResources.length / initialCount,
            "Cache effectiveness"
          ).to.be.gte(0.3);
        });
      });
    });

    it("Total page size is within budget", () => {
      cy.window().then((win) => {
        const resources = win.performance.getEntriesByType("resource");
        const totalSize = resources.reduce((sum, resource) => {
          return sum + (resource.transferSize || 0);
        }, 0);

        const totalMB = (totalSize / (1024 * 1024)).toFixed(2);
        const budgetMB = (
          PERFORMANCE_BUDGETS.totalPageSize /
          (1024 * 1024)
        ).toFixed(2);

        cy.logMetric("Total Page Size", `${totalMB}MB`);
        cy.log(`Budget: ${budgetMB}MB`);

        expect(totalSize, "Total page size").to.be.lessThan(
          PERFORMANCE_BUDGETS.totalPageSize
        );
      });
    });
  });

  describe("8. Nuxt-Specific Optimizations", () => {
    it("Nuxt is running in production mode", () => {
      cy.window().then((win) => {
        const isDev =
          win.__NUXT__?.config?.dev || win.$nuxt?.$config?.dev || false;

        expect(isDev, "Production mode").to.be.false;
      });
    });

    it("Vue is running in production mode", () => {
      cy.window().then((win) => {
        // Vue production mode has different global properties
        const isProd = win.__VUE__ && !win.__VUE__.config?.productionTip;

        if (isProd !== undefined) {
          expect(isProd, "Vue production mode").to.be.true;
        }
      });
    });

    it("No unnecessary console logs in production", () => {
      const logs = [];

      cy.window().then((win) => {
        const originalLog = win.console.log;
        win.console.log = (...args) => {
          logs.push(args.join(" "));
          originalLog.apply(win.console, args);
        };
      });

      cy.wait(2000);

      cy.wrap(logs).then((allLogs) => {
        const appLogs = allLogs.filter(
          (log) => !log.includes("Cypress") && !log.includes("[METRIC]")
        );

        cy.logMetric("Console Logs", appLogs.length);

        // Production should have minimal logging
        expect(appLogs.length, "Console noise").to.be.lessThan(5);
      });
    });
  });

  describe("9. Performance Summary Report", () => {
    it("Generate comprehensive Nuxt performance report", () => {
      waitForHydration();

      cy.window().then((win) => {
        const perfData = win.performance.timing;
        const resources = win.performance.getEntriesByType("resource");
        const nuxtData = win.__NUXT__ || win.__NUXT_DATA__ || {};

        const report = {
          timestamp: new Date().toISOString(),
          url: win.location.href,
          framework: "Nuxt.js / Vue SSR",
          metrics: {
            // SSR Metrics
            ttfb: perfData.responseStart - perfData.navigationStart,
            serverRenderTime: perfData.responseEnd - perfData.requestStart,

            // Load Metrics
            pageLoad: perfData.loadEventEnd - perfData.navigationStart,
            domContentLoaded:
              perfData.domContentLoadedEventEnd - perfData.navigationStart,
            domInteractive: perfData.domInteractive - perfData.navigationStart,

            // Resources
            resourceCount: resources.length,
            totalSize: resources.reduce(
              (sum, r) => sum + (r.transferSize || 0),
              0
            ),
            scriptCount: resources.filter((r) => r.initiatorType === "script")
              .length,
            imageCount: resources.filter((r) => r.initiatorType === "img")
              .length,

            // DOM
            domNodeCount: win.document.getElementsByTagName("*").length,

            // Nuxt-specific
            ssrPayloadSize: JSON.stringify(nuxtData).length,
            nuxtChunks: resources.filter((r) => r.name.includes("chunk"))
              .length,
          },
          budgets: PERFORMANCE_BUDGETS,
        };

        cy.task("log", "=== NUXT PERFORMANCE REPORT ===");
        cy.task("log", JSON.stringify(report, null, 2));

        // Save report
        cy.writeFile("cypress/reports/performance-latest.json", report);

        // Verify key Nuxt metrics
        expect(report.metrics.ttfb).to.be.lessThan(
          report.budgets.serverResponse
        );
        expect(report.metrics.ssrPayloadSize).to.be.lessThan(
          report.budgets.ssrPayloadSize
        );
      });
    });
  });
});
