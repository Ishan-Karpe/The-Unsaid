// ===========================================
// THE UNSAID - Validation Utilities
// ===========================================
// Provides form validation and real-time feedback helpers
//
// @module validation

// ===========================================
// EMAIL VALIDATION
// ===========================================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

// ===========================================
// PASSWORD VALIDATION
// ===========================================

export interface PasswordValidation {
	valid: boolean;
	score: number;
	feedback: string[];
	requirements: {
		minLength: boolean;
		lowercase: boolean;
		uppercase: boolean;
		number: boolean;
		special: boolean;
	};
}

/**
 * Validate password strength
 * Returns an object with validation results
 */
export function validatePassword(password: string): PasswordValidation {
	const feedback: string[] = [];
	let score = 0;

	const requirements = {
		minLength: password.length >= 8,
		lowercase: /[a-z]/.test(password),
		uppercase: /[A-Z]/.test(password),
		number: /\d/.test(password),
		special: /[^a-zA-Z0-9]/.test(password)
	};

	if (requirements.minLength) {
		score += 1;
	} else {
		feedback.push('At least 8 characters');
	}

	if (password.length >= 12) {
		score += 1;
	}

	if (requirements.lowercase) {
		score += 1;
	} else {
		feedback.push('One lowercase letter');
	}

	if (requirements.uppercase) {
		score += 1;
	} else {
		feedback.push('One uppercase letter');
	}

	if (requirements.number) {
		score += 1;
	} else {
		feedback.push('One number');
	}

	if (requirements.special) {
		score += 1;
	}

	return {
		valid: score >= 4 && password.length >= 8,
		score: Math.min(score, 5),
		feedback,
		requirements
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
