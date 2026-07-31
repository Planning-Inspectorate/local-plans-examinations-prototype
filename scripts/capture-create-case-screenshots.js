#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const playwrightConfig = require('../playwright.config');

const BASE_URL = process.env.BASE_URL || playwrightConfig.use.baseURL;
const VIEWPORT = playwrightConfig.use.viewport;
const HEADLESS = playwrightConfig.use.headless;
const BROWSER_CHANNEL = playwrightConfig.use.channel;
const ROOT = process.cwd();
const SCREENSHOT_ROOT = path.join(ROOT, 'screenshots');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function stepFile(versionDir, stepNumber, name) {
  const prefix = String(stepNumber).padStart(2, '0');
  return path.join(versionDir, `${prefix}-${name}.png`);
}

async function capture(page, versionDir, stepNumber, name) {
  await page.waitForLoadState('domcontentloaded');
  await page.screenshot({
    path: stepFile(versionDir, stepNumber, name),
    fullPage: true
  });
}

async function clickContinue(page) {
  const continueButton = page.getByRole('button', { name: 'Continue' });
  if (await continueButton.count()) {
    await continueButton.first().click();
    return;
  }

  const continueLink = page.getByRole('link', { name: /^Continue/ });
  if (await continueLink.count()) {
    await continueLink.first().click();
    return;
  }

  throw new Error('Could not find a Continue control on the current page.');
}

async function runJourney(browser, version) {
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();
  const versionDir = path.join(SCREENSHOT_ROOT, `v${version}`);
  ensureDir(versionDir);

  let step = 1;

  const basePath = `/projects/back-office/create-case/v${version}`;
  await page.goto(`${BASE_URL}${basePath}/index`, { waitUntil: 'domcontentloaded' });
  await capture(page, versionDir, step++, 'index');

  await page.goto(`${BASE_URL}${basePath}/0-case-officer-name`, { waitUntil: 'domcontentloaded' });
  await capture(page, versionDir, step++, 'case-officer');

  await page.selectOption('#caseOfficer', { label: 'Jane Smith' });
  await clickContinue(page);

  await page.waitForURL(`**${basePath}/1-plan-title`, { waitUntil: 'domcontentloaded' });
  await capture(page, versionDir, step++, 'plan-title');

  await page.fill('input[name="plan-title"]', `Automation capture plan v${version}`);
  await clickContinue(page);

  await page.waitForURL(`**${basePath}/2-plan-type`, { waitUntil: 'domcontentloaded' });
  await capture(page, versionDir, step++, 'plan-type');

  await page.check('input[name="plan-type"][value="local-plan"]');
  await clickContinue(page);

  await page.waitForURL(`**${basePath}/3-select-LPA`, { waitUntil: 'domcontentloaded' });
  await capture(page, versionDir, step++, 'select-lpa');

  await page.selectOption('#lpa', { index: 1 });
  await clickContinue(page);

  await page.waitForURL(`**${basePath}/add-additional-lpa`, { waitUntil: 'domcontentloaded' });
  await capture(page, versionDir, step++, 'add-additional-lpa');

  await page.check('input[name="hasAdditionalLPA"][value="no"]');
  await clickContinue(page);

  await page.waitForURL(`**${basePath}/main-contact`, { waitUntil: 'domcontentloaded' });
  await capture(page, versionDir, step++, 'main-contact');

  if (version === 2) {
    await page.fill('input[name="mainContactFirstName"]', 'Taylor');
    await page.fill('input[name="mainContactLastName"]', 'Morgan');
  } else {
    await page.fill('input[name="mainContactFullName"]', 'Taylor Morgan');
  }
  await page.fill('input[name="mainContactEmail"]', `taylor.morgan.v${version}@example.com`);
  await page.fill('input[name="mainContactPhone"]', '01234 567890');
  await clickContinue(page);

  await page.waitForURL(`**${basePath}/check-contact-details`, { waitUntil: 'domcontentloaded' });
  await capture(page, versionDir, step++, 'check-contact-details');
  await clickContinue(page);

  await page.waitForURL(`**${basePath}/enter-key-dates`, { waitUntil: 'domcontentloaded' });
  await capture(page, versionDir, step++, 'enter-key-dates');
  await clickContinue(page);

  await page.waitForURL(`**${basePath}/check-answers`, { waitUntil: 'domcontentloaded' });
  await capture(page, versionDir, step++, 'check-answers');

  await page.getByRole('button', { name: 'Submit case' }).click();
  await page.waitForURL(`**${basePath}/confirmation`, { waitUntil: 'domcontentloaded' });
  await capture(page, versionDir, step++, 'confirmation');

  await context.close();
}

async function main() {
  ensureDir(SCREENSHOT_ROOT);

  const browser = await chromium.launch({ headless: HEADLESS, channel: BROWSER_CHANNEL });
  try {
    await runJourney(browser, 2);
    await runJourney(browser, 3);
    await runJourney(browser, 5);
    console.log('Screenshots captured in screenshots/v2, screenshots/v3, and screenshots/v5');
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
