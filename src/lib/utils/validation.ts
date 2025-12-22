// ===========================================
// THE UNSAID - Validation Utilities
// ===========================================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

/**
 * Validate password strength
 * Returns an object with validation results
 */
export function validatePassword(password: string): {
	valid: boolean;
	score: number;
	feedback: string[];
} {
	const feedback: string[] = [];
	let score = 0;

	if (password.length >= 8) {
		score += 1;
	} else {
		feedback.push('At least 8 characters');
	}

	if (password.length >= 12) {
		score += 1;
	}

	if (/[a-z]/.test(password)) {
		score += 1;
	} else {
		feedback.push('One lowercase letter');
	}

	if (/[A-Z]/.test(password)) {
		score += 1;
	} else {
		feedback.push('One uppercase letter');
	}

	if (/\d/.test(password)) {
		score += 1;
	} else {
		feedback.push('One number');
	}

	if (/[^a-zA-Z0-9]/.test(password)) {
		score += 1;
	}

	return {
		valid: score >= 4 && password.length >= 8,
		score: Math.min(score, 5),
		feedback
	};
}

/**
 * Get password strength label
 */
export function getPasswordStrengthLabel(score: number): string {
	if (score <= 1) return 'Weak';
	if (score <= 2) return 'Fair';
	if (score <= 3) return 'Good';
	if (score <= 4) return 'Strong';
	return 'Very Strong';
}

/**
 * Get password strength color (DaisyUI)
 */
export function getPasswordStrengthColor(score: number): string {
	if (score <= 1) return 'bg-error';
	if (score <= 2) return 'bg-warning';
	if (score <= 3) return 'bg-info';
	return 'bg-success';
}
