// cypress.config.js
const { defineConfig } = require('cypress');
const fs = require('fs');
const path = require('path');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://www.greggs.com',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    screenshotsFolder: 'cypress/screenshots',
    trashAssetsBeforeRuns: true,

    // Timeouts optimized for stability
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 30000,
    requestTimeout: 15000,
    responseTimeout: 15000,

    // Retry configuration for stability
    retries: {
      runMode: 2,
      openMode: 0,
    },

    // Keep test isolation on (default) - we'll use cy.session for state
    testIsolation: true,


    // Reporter configuration
    reporter: 'mochawesome',
    reporterOptions: {
      reportDir: 'cypress/reports',
      overwrite: false,
      html: true,
      json: true,
      charts: true,
      reportTitle: 'Greggs Menu Test Report',
      reportPageTitle: 'Greggs Menu Automation Results',
      embeddedScreenshots: true,
      inlineAssets: true,
      saveAllAttempts: false,
    },

    // Be explicit (optional; defaults to this path anyway)
    supportFile: 'cypress/support/e2e.js',

    // Spec discovery: include both .spec and .cy files
    specPattern: ['cypress/e2e/**/*.{spec,cy}.{js,jsx,ts,tsx}'],
    // Don’t accidentally pick up our JSON baselines as tests
    excludeSpecPattern: ['cypress/visual-baselines/**/*'],

    setupNodeEvents(on, config) {
      // ---- Tasks (merged into a single on('task', ...) call) ----
      on('task', {
        // Logging you already use
        log(message) {
          console.log(`[${new Date().toISOString()}] ${message}`);
          return null;
        },
        getTimestamp() {
          return Date.now();
        },

        // NEW: store/load tiny JSON files for the visual layout baseline
        saveJson({ filename, data }) {
          const file = path.resolve(process.cwd(), filename);
          fs.mkdirSync(path.dirname(file), { recursive: true });
          fs.writeFileSync(file, JSON.stringify(data, null, 2));
          return null;
        },
        loadJson({ filename }) {
          try {
            const file = path.resolve(process.cwd(), filename);
            const raw = fs.readFileSync(file, 'utf-8');
            return JSON.parse(raw);
          } catch (e) {
            return null; // baseline not found yet (first run seeds)
          }
        },
      });

      // ---- Browser launch tweaks ----
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.family === 'chromium') {
          // Basic stability flags only
          launchOptions.args.push('--disable-gpu');
          launchOptions.args.push('--disable-dev-shm-usage');
          launchOptions.args.push('--no-sandbox');
          launchOptions.args.push('--disable-setuid-sandbox');

          // Set window size for consistency
          launchOptions.args.push(`--window-size=${config.viewportWidth},${config.viewportHeight}`);

          if (browser.isHeadless) {
            // Use new headless mode when available
            launchOptions.args.push('--headless=new');
          }

          // Increase memory limits for stability
          launchOptions.args.push('--max_old_space_size=4096');
        }

        return launchOptions;
      });

      return config;
    },

    // Environment variables
    env: {
      // OneTrust configuration for deterministic behavior
      CMP_RESET_QUERY: 'otreset=true&otpreview=false&otgeo=gb',
      CMP_QUERY: 'otpreview=false&otgeo=gb',

      // Viewport presets (used in tests if you reference them)
      MOBILE_VIEWPORT_WIDTH: 375,
      MOBILE_VIEWPORT_HEIGHT: 667,
      TABLET_VIEWPORT_WIDTH: 768,
      TABLET_VIEWPORT_HEIGHT: 1024,

      // Performance thresholds (tests can read from Cypress.env)
      MAX_PAGE_LOAD_TIME: 5000,
      MAX_API_RESPONSE_TIME: 2000,

      // Visual baselines directory (used by visual-regression.spec.js)
      VISUAL_BASELINES_DIR: 'cypress/visual-baselines',
    },
  },
});
