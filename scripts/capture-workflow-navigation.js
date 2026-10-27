#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const playwrightConfig = require('../playwright.config');

const BASE_URL = process.env.BASE_URL || playwrightConfig.use.baseURL;
const START_PATH = '/projects/back-office/create-case/v4/index';
const OUTPUT_ROOT = path.resolve(process.env.SCREENSHOT_DIR || path.join(process.cwd(), 'screenshots/workflow-navigation'));
const VIEWPORT = playwrightConfig.use.viewport;
const HEADLESS = playwrightConfig.use.headless;
const BROWSER_CHANNEL = playwrightConfig.use.channel;

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function slug(value) {
  return String(value || 'page')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'page';
}

function recordError(errors, type, details) {
  errors.push({
    type,
    timestamp: new Date().toISOString(),
    ...details
  });
}

async function getFooterStateLinks(page) {
  return page.locator('footer a').evaluateAll((links) => links
    .map((link) => ({ name: link.textContent.trim(), href: link.href }))
    .filter((link) => {
      const url = new URL(link.href);
      const isStateRoute = /\/(?:set-status|set-state|reset-status-flow)$/.test(url.pathname);
      const hasStateParameter = ['state', 'status', 'scenario'].some((key) => url.searchParams.has(key));
      return isStateRoute || hasStateParameter;
    }));
}

async function getSectionContentLinks(page) {
  const pageUrl = new URL(page.url());
  const links = await page.locator('main a[href]').evaluateAll((anchors) =>
    anchors
      .filter((anchor) => !anchor.closest('nav'))
      .map((anchor) => ({ name: anchor.textContent.trim(), href: anchor.href }))
  );
  const uniqueLinks = new Map();

  for (const link of links) {
    const url = new URL(link.href, pageUrl);
    const isCreateCaseFlow = url.pathname.includes('/create-case/');
    const isDocumentDownload = /\/documents\/download\//.test(url.pathname);
    const isFile = /\.(pdf|docx?|xlsx?|pptx?|jpe?g|png|tiff?|zip)$/i.test(url.pathname);
    const isCurrentPage = url.pathname === pageUrl.pathname && url.search === pageUrl.search;

    if (url.origin !== pageUrl.origin || isCreateCaseFlow || isDocumentDownload || isFile || isCurrentPage) {
      continue;
    }

    url.hash = '';
    if (!uniqueLinks.has(url.href)) {
      uniqueLinks.set(url.href, { name: link.name || url.pathname, href: url.href });
    }
  }

  return [...uniqueLinks.values()];
}

async function captureContentLinks(page, options) {
  const { section, sectionPrefix, sectionSlug, stateName, outputDir, captures, errors } = options;
  const contentLinks = await getSectionContentLinks(page);

  for (const [index, contentLink] of contentLinks.entries()) {
    const url = new URL(contentLink.href, BASE_URL);
    const screenshot = `${sectionPrefix}-${sectionSlug}-${slug(stateName)}-link-${String(index + 1).padStart(2, '0')}-${slug(contentLink.name)}.png`;
    let status = null;

    try {
      const response = await page.goto(url.href, { waitUntil: 'domcontentloaded' });
      status = response?.status() || null;
      await page.screenshot({ path: path.join(outputDir, screenshot), fullPage: true });
    } catch (error) {
      recordError(errors, 'section-content-link', {
        section,
        state: stateName,
        name: contentLink.name,
        url: url.href,
        message: error.message
      });
    }

    captures.push({
      name: section,
      state: `${stateName} link`,
      link: contentLink.name,
      url: url.href,
      status,
      screenshot
    });
  }
}

async function main() {
  const errors = [];
  const captures = [];
  let outputDir = OUTPUT_ROOT;
  let browser;
  let fatalError;

  try {
    browser = await chromium.launch({ headless: HEADLESS, channel: BROWSER_CHANNEL });
    const context = await browser.newContext({ viewport: VIEWPORT });
    const page = await context.newPage();

    page.on('console', (message) => {
      if (message.type() === 'error') {
        recordError(errors, 'console', {
          url: page.url(),
          message: message.text()
        });
      }
    });
    page.on('pageerror', (error) => {
      recordError(errors, 'pageerror', {
        url: page.url(),
        message: error.message,
        stack: error.stack
      });
    });
    page.on('requestfailed', (request) => {
      recordError(errors, 'requestfailed', {
        url: request.url(),
        method: request.method(),
        error: request.failure()?.errorText || 'Request failed'
      });
    });
    page.on('response', (response) => {
      if (response.status() >= 400) {
        recordError(errors, 'http-response', {
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });

    const indexResponse = await page.goto(`${BASE_URL}${START_PATH}`, { waitUntil: 'domcontentloaded' });
    if (indexResponse && indexResponse.status() >= 400) {
      recordError(errors, 'index-navigation', {
        url: indexResponse.url(),
        status: indexResponse.status(),
        statusText: indexResponse.statusText()
      });
    }

    const caseLinks = await page.locator('a[href*="/projects/back-office/create-case/v4/load-case?caseRef="]').evaluateAll((links) =>
      links.map((link) => ({ href: link.href, caseRef: new URL(link.href).searchParams.get('caseRef') }))
    );
    const requestedCaseRef = process.env.CASE_REF;
    const selectedCase = requestedCaseRef
      ? caseLinks.find((link) => link.caseRef === requestedCaseRef)
      : caseLinks[0];

    if (!selectedCase) {
      throw new Error(requestedCaseRef
        ? `Case ${requestedCaseRef} is not listed on the v4 All Cases page.`
        : 'No existing cases were listed on the v4 All Cases page.');
    }

    const safeCaseRef = slug(selectedCase.caseRef);
    outputDir = path.join(OUTPUT_ROOT, safeCaseRef);
    ensureDir(outputDir);
    await page.screenshot({ path: path.join(outputDir, '00-all-cases.png'), fullPage: true });
    captures.push({ name: 'All Cases', url: page.url(), status: indexResponse?.status() || null, screenshot: '00-all-cases.png' });

    const caseResponse = await page.goto(selectedCase.href, { waitUntil: 'domcontentloaded' });
    if (caseResponse && caseResponse.status() >= 400) {
      recordError(errors, 'case-load', {
        url: caseResponse.url(),
        status: caseResponse.status(),
        statusText: caseResponse.statusText()
      });
    }

    const sectionLinks = await page.locator('nav[aria-label="Case workflow navigation"] a').evaluateAll((links) =>
      links.map((link) => ({ name: link.textContent.trim(), href: link.href }))
    );
    if (!sectionLinks.length) {
      throw new Error(`No case workflow navigation links found at ${page.url()}.`);
    }

    for (const [index, section] of sectionLinks.entries()) {
      const destination = new URL(section.href, BASE_URL);
      if (destination.origin !== new URL(BASE_URL).origin) {
        recordError(errors, 'external-navigation-skipped', { name: section.name, url: destination.href });
        continue;
      }

      const sectionPrefix = String(index + 1).padStart(2, '0');
      const sectionSlug = slug(section.name);
      let responseStatus = null;
      try {
        const response = await page.goto(destination.href, { waitUntil: 'domcontentloaded' });
        responseStatus = response?.status() || null;
        const defaultScreenshot = `${sectionPrefix}-${sectionSlug}-default.png`;
        await page.screenshot({ path: path.join(outputDir, defaultScreenshot), fullPage: true });
        captures.push({
          name: section.name,
          state: 'default',
          url: page.url(),
          status: responseStatus,
          screenshot: defaultScreenshot
        });

        const stateLinks = await getFooterStateLinks(page);
        await captureContentLinks(page, {
          section: section.name,
          sectionPrefix,
          sectionSlug,
          stateName: 'default',
          outputDir,
          captures,
          errors
        });
        for (const stateLink of stateLinks) {
          const stateUrl = new URL(stateLink.href, BASE_URL);
          if (stateUrl.origin !== new URL(BASE_URL).origin) {
            recordError(errors, 'external-state-link-skipped', { section: section.name, name: stateLink.name, url: stateUrl.href });
            continue;
          }

          const stateScreenshot = `${sectionPrefix}-${sectionSlug}-${slug(stateLink.name)}.png`;
          let stateStatus = null;
          try {
            const stateResponse = await page.goto(stateUrl.href, { waitUntil: 'domcontentloaded' });
            stateStatus = stateResponse?.status() || null;
            await page.screenshot({ path: path.join(outputDir, stateScreenshot), fullPage: true });
          } catch (error) {
            recordError(errors, 'state-navigation', {
              section: section.name,
              state: stateLink.name,
              url: stateUrl.href,
              message: error.message
            });
          }

          captures.push({
            name: section.name,
            state: stateLink.name,
            url: page.url(),
            stateUrl: stateUrl.href,
            status: stateStatus,
            screenshot: stateScreenshot
          });

          const stateContentLinks = await getSectionContentLinks(page);
          if (stateContentLinks.length) {
            for (const [linkIndex, contentLink] of stateContentLinks.entries()) {
              const contentUrl = new URL(contentLink.href, BASE_URL);
              const contentScreenshot = `${sectionPrefix}-${sectionSlug}-${slug(stateLink.name)}-link-${String(linkIndex + 1).padStart(2, '0')}-${slug(contentLink.name)}.png`;
              let contentStatus = null;
              try {
                const contentResponse = await page.goto(contentUrl.href, { waitUntil: 'domcontentloaded' });
                contentStatus = contentResponse?.status() || null;
                await page.screenshot({ path: path.join(outputDir, contentScreenshot), fullPage: true });
              } catch (error) {
                recordError(errors, 'section-content-link', {
                  section: section.name,
                  state: stateLink.name,
                  name: contentLink.name,
                  url: contentUrl.href,
                  message: error.message
                });
              }
              captures.push({
                name: section.name,
                state: `${stateLink.name} link`,
                link: contentLink.name,
                url: contentUrl.href,
                status: contentStatus,
                screenshot: contentScreenshot
              });
            }
          }
        }
      } catch (error) {
        recordError(errors, 'section-navigation', {
          name: section.name,
          url: destination.href,
          message: error.message
        });
      }
    }

    await context.close();
  } catch (error) {
    fatalError = error;
    recordError(errors, 'capture', { message: error.message, stack: error.stack });
  } finally {
    ensureDir(outputDir);
    fs.writeFileSync(path.join(outputDir, 'errors.json'), `${JSON.stringify(errors, null, 2)}\n`);
    fs.writeFileSync(path.join(outputDir, 'pages.json'), `${JSON.stringify(captures, null, 2)}\n`);
    if (browser) await browser.close();
  }

  if (fatalError) throw fatalError;

  console.log(`Captured ${captures.length} pages for ${path.basename(outputDir)} in ${outputDir}`);
  console.log(`Error log: ${path.join(outputDir, 'errors.json')}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});