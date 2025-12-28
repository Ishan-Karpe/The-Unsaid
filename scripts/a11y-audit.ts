// ===========================================
// THE UNSAID - Accessibility Audit Script
// ===========================================
// Uses Playwright + axe-core to run accessibility audits
// Run with: npx tsx scripts/a11y-audit.ts

import { chromium, type Browser, type Page } from 'playwright';

// Note: @axe-core/playwright needs to be installed: pnpm add -D @axe-core/playwright
// If not installed, this script provides manual guidance

const BASE_URL = 'http://localhost:5173';

// Pages to audit
const PAGES_TO_AUDIT = [
	{ name: 'Landing', path: '/' },
	{ name: 'Login', path: '/login' },
	{ name: 'Signup', path: '/signup' },
	{ name: 'Forgot Password', path: '/forgot-password' }
];

// WCAG tags to check
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

interface A11yViolation {
	id: string;
	impact: string | undefined;
	description: string;
	help: string;
	helpUrl: string;
	nodes: number;
}

interface A11yResult {
	page: string;
	url: string;
	violations: A11yViolation[];
	passes: number;
	incomplete: number;
	critical: number;
	serious: number;
	moderate: number;
	minor: number;
}

/**
 * Run accessibility audit on a page using axe-core
 */
async function auditPage(page: Page, pageName: string, path: string): Promise<A11yResult> {
	const url = `${BASE_URL}${path}`;
	console.log(`\n📄 Auditing: ${pageName} (${url})`);

	await page.goto(url);
	await page.waitForLoadState('networkidle');

	// Inject axe-core script
	await page.addScriptTag({
		url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.3/axe.min.js'
	});

	// Run axe-core analysis
	const results = await page.evaluate((tags: string[]) => {
		// @ts-expect-error axe is injected via script tag
		return window.axe.run(document, {
			runOnly: {
				type: 'tag',
				values: tags
			}
		});
	}, WCAG_TAGS);

	// Process violations
	const violations: A11yViolation[] = results.violations.map(
		(v: {
			id: string;
			impact: string | undefined;
			description: string;
			help: string;
			helpUrl: string;
			nodes: unknown[];
		}) => ({
			id: v.id,
			impact: v.impact,
			description: v.description,
			help: v.help,
			helpUrl: v.helpUrl,
			nodes: v.nodes.length
		})
	);

	const result: A11yResult = {
		page: pageName,
		url,
		violations,
		passes: results.passes?.length || 0,
		incomplete: results.incomplete?.length || 0,
		critical: violations.filter((v) => v.impact === 'critical').length,
		serious: violations.filter((v) => v.impact === 'serious').length,
		moderate: violations.filter((v) => v.impact === 'moderate').length,
		minor: violations.filter((v) => v.impact === 'minor').length
	};

	// Print summary for this page
	console.log(`   Violations: ${violations.length}`);
	console.log(
		`   Critical: ${result.critical} | Serious: ${result.serious} | Moderate: ${result.moderate} | Minor: ${result.minor}`
	);

	if (violations.length > 0) {
		console.log('   Issues:');
		violations.forEach((v) => {
			const impactColor =
				v.impact === 'critical' ? '\x1b[31m' : v.impact === 'serious' ? '\x1b[33m' : '\x1b[0m';
			console.log(
				`     ${impactColor}[${v.impact?.toUpperCase()}]\x1b[0m ${v.help} (${v.nodes} elements)`
			);
		});
	} else {
		console.log('   ✅ No violations found!');
	}

	return result;
}

/**
 * Main audit function
 */
async function runAudit(): Promise<void> {
	console.log('🔍 The Unsaid - Accessibility Audit');
	console.log('====================================');
	console.log(`WCAG Standards: ${WCAG_TAGS.join(', ')}`);

	let browser: Browser | null = null;

	try {
		browser = await chromium.launch({ headless: true });
		const context = await browser.newContext();
		const page = await context.newPage();

		const results: A11yResult[] = [];

		for (const pageInfo of PAGES_TO_AUDIT) {
			try {
				const result = await auditPage(page, pageInfo.name, pageInfo.path);
				results.push(result);
			} catch (error) {
				console.error(`   ❌ Error auditing ${pageInfo.name}:`, error);
			}
		}

		await browser.close();

		// Print final summary
		console.log('\n====================================');
		console.log('📋 Final Summary');
		console.log('====================================\n');

		const totalViolations = results.reduce((sum, r) => sum + r.violations.length, 0);
		const totalCritical = results.reduce((sum, r) => sum + r.critical, 0);
		const totalSerious = results.reduce((sum, r) => sum + r.serious, 0);
		const totalModerate = results.reduce((sum, r) => sum + r.moderate, 0);
		const totalMinor = results.reduce((sum, r) => sum + r.minor, 0);

		console.log(`Total Violations: ${totalViolations}`);
		console.log(`  Critical: ${totalCritical}`);
		console.log(`  Serious:  ${totalSerious}`);
		console.log(`  Moderate: ${totalModerate}`);
		console.log(`  Minor:    ${totalMinor}`);
		console.log('');

		// Per-page summary table
		console.log('Per-Page Summary:');
		console.log('─'.repeat(60));
		console.log('Page'.padEnd(20) + 'Violations'.padEnd(12) + 'Critical'.padEnd(10) + 'Serious');
		console.log('─'.repeat(60));

		results.forEach((r) => {
			console.log(
				r.page.padEnd(20) +
					r.violations.length.toString().padEnd(12) +
					r.critical.toString().padEnd(10) +
					r.serious.toString()
			);
		});

		console.log('─'.repeat(60));
		console.log('');

		// Exit with error if critical or serious issues found
		if (totalCritical > 0 || totalSerious > 0) {
			console.log(
				`\x1b[31m⚠️  Found ${totalCritical} critical and ${totalSerious} serious issues that need attention.\x1b[0m`
			);
			process.exit(1);
		} else if (totalViolations > 0) {
			console.log(
				`\x1b[33m⚠️  Found ${totalViolations} minor/moderate issues. Consider addressing them.\x1b[0m`
			);
		} else {
			console.log('\x1b[32m✅ No accessibility violations found!\x1b[0m');
		}
	} catch (error) {
		console.error('\x1b[31mFailed to run accessibility audit:\x1b[0m', error);
		if (browser) {
			await browser.close();
		}
		process.exit(1);
	}
}

// Run the audit
runAudit();
