// ===========================================
// THE UNSAID - Responsive Design Utilities
// ===========================================
// Utility functions and constants for responsive design
// Use with Svelte's $effect or onMount for reactive viewport detection

/**
 * Tailwind CSS v4 breakpoints in pixels
 * These match the default Tailwind configuration
 */
export const BREAKPOINTS = {
	sm: 640,
	md: 768,
	lg: 1024,
	xl: 1280,
	'2xl': 1536
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Check if current viewport is mobile (< md breakpoint)
 * Only use in browser context (onMount or $effect)
 */
export function isMobile(): boolean {
	if (typeof window === 'undefined') return false;
	return window.innerWidth < BREAKPOINTS.md;
}

/**
 * Check if current viewport is tablet (md to lg)
 */
export function isTablet(): boolean {
	if (typeof window === 'undefined') return false;
	return window.innerWidth >= BREAKPOINTS.md && window.innerWidth < BREAKPOINTS.lg;
}

/**
 * Check if current viewport is desktop (>= lg)
 */
export function isDesktop(): boolean {
	if (typeof window === 'undefined') return false;
	return window.innerWidth >= BREAKPOINTS.lg;
}

/**
 * Check if viewport is at or above a specific breakpoint
 */
export function isAtLeast(breakpoint: Breakpoint): boolean {
	if (typeof window === 'undefined') return false;
	return window.innerWidth >= BREAKPOINTS[breakpoint];
}

/**
 * Check if viewport is below a specific breakpoint
 */
export function isBelow(breakpoint: Breakpoint): boolean {
	if (typeof window === 'undefined') return true;
	return window.innerWidth < BREAKPOINTS[breakpoint];
}

/**
 * Get current breakpoint name
 */
export function getCurrentBreakpoint(): Breakpoint | 'xs' {
	if (typeof window === 'undefined') return 'xs';

	const width = window.innerWidth;

	if (width >= BREAKPOINTS['2xl']) return '2xl';
	if (width >= BREAKPOINTS.xl) return 'xl';
	if (width >= BREAKPOINTS.lg) return 'lg';
	if (width >= BREAKPOINTS.md) return 'md';
	if (width >= BREAKPOINTS.sm) return 'sm';
	return 'xs';
}

/**
 * Minimum touch target size in pixels (WCAG 2.1 Level AAA)
 * All interactive elements should be at least this size
 */
export const MIN_TOUCH_TARGET = 44;

/**
 * Minimum spacing between touch targets in pixels
 */
export const MIN_TOUCH_SPACING = 8;

/**
 * Common responsive class patterns for use with Tailwind
 * Import and spread into class attributes
 */
export const RESPONSIVE_PATTERNS = {
	// Stack on mobile, row on desktop
	stackToRow: 'flex flex-col md:flex-row',

	// Row on mobile, stack on desktop (rare but useful)
	rowToStack: 'flex flex-row md:flex-col',

	// Hide on mobile, show on desktop
	hideOnMobile: 'hidden md:block',

	// Show on mobile, hide on desktop
	showOnMobile: 'block md:hidden',

	// Hide on mobile, inline on desktop
	hideOnMobileInline: 'hidden md:inline',

	// Flex hide/show variants
	hideOnMobileFlex: 'hidden md:flex',
	showOnMobileFlex: 'flex md:hidden',

	// Full width on mobile, auto on desktop
	fullOnMobile: 'w-full md:w-auto',

	// Container padding that adapts
	responsivePadding: 'p-4 md:p-6 lg:p-8',

	// Horizontal padding only
	responsivePaddingX: 'px-4 md:px-6 lg:px-8',

	// Gap that adapts
	responsiveGap: 'gap-3 md:gap-4 lg:gap-6',

	// Text sizing
	responsiveText: 'text-sm md:text-base lg:text-lg',

	// Heading sizing
	responsiveHeading: 'text-xl md:text-2xl lg:text-3xl',

	// Max width for readability
	proseWidth: 'max-w-prose mx-auto'
} as const;

/**
 * Tailwind classes for ensuring minimum touch target size
 */
export const TOUCH_TARGET_CLASSES = 'min-h-[44px] min-w-[44px]';

/**
 * Debounced resize handler for viewport changes
 * Use in onMount to react to viewport changes
 *
 * @example
 * onMount(() => {
 *   return onResize(() => {
 *     currentBreakpoint = getCurrentBreakpoint();
 *   });
 * });
 */
export function onResize(callback: () => void, debounceMs = 100): () => void {
	if (typeof window === 'undefined') return () => {};

	let timeoutId: ReturnType<typeof setTimeout>;

	const handler = () => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(callback, debounceMs);
	};

	window.addEventListener('resize', handler);

	return () => {
		clearTimeout(timeoutId);
		window.removeEventListener('resize', handler);
	};
}

/**
 * Media query hook for SSR-safe responsive checks
 * Returns a function that returns current match state
 *
 * @example
 * const isDesktop = createMediaQuery('(min-width: 1024px)');
 * // In $effect or event handler:
 * if (isDesktop()) { ... }
 */
export function createMediaQuery(query: string): () => boolean {
	if (typeof window === 'undefined') {
		return () => false;
	}

	const mediaQuery = window.matchMedia(query);
	return () => mediaQuery.matches;
}

/**
 * Prefers reduced motion check
 * Use to disable animations for users who prefer reduced motion
 */
export function prefersReducedMotion(): boolean {
	if (typeof window === 'undefined') return false;
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if device has touch capability
 */
export function hasTouchCapability(): boolean {
	if (typeof window === 'undefined') return false;
	return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Safe area inset CSS custom properties
 * Use for devices with notches or rounded corners
 */
export const SAFE_AREA_INSETS = {
	top: 'env(safe-area-inset-top)',
	right: 'env(safe-area-inset-right)',
	bottom: 'env(safe-area-inset-bottom)',
	left: 'env(safe-area-inset-left)'
} as const;
