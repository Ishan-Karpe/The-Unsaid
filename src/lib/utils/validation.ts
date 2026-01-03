// ===========================================
// THE UNSAID - Validation Utilities
// ===========================================
// Provides form validation, real-time feedback, and field-level errors
//
// USAGE:
// - Use individual validators for specific fields
// - Use createFormValidator for complete form validation
// - All validators return { valid, errors } for consistent handling
//
// @module validation

import { INPUT_LIMITS } from './sanitization';

// ===========================================
// TYPES
// ===========================================

export interface ValidationResult {
	valid: boolean;
	error?: string;
}

export interface FieldValidation {
	valid: boolean;
	errors: string[];
}

export interface FormValidation<T extends Record<string, unknown>> {
	valid: boolean;
	errors: Partial<Record<keyof T, string>>;
}

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

/**
 * Validate email with detailed result
 */
export function validateEmail(email: string): ValidationResult {
	if (!email || email.trim() === '') {
		return { valid: false, error: 'Email is required' };
	}

	const trimmed = email.trim();

	if (trimmed.length > INPUT_LIMITS.EMAIL) {
		return { valid: false, error: `Email must be under ${INPUT_LIMITS.EMAIL} characters` };
	}

	if (!isValidEmail(trimmed)) {
		return { valid: false, error: 'Please enter a valid email address' };
	}

	return { valid: true };
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

/**
 * Validate password confirmation
 */
export function validatePasswordMatch(password: string, confirmPassword: string): ValidationResult {
	if (!confirmPassword) {
		return { valid: false, error: 'Please confirm your password' };
	}

	if (password !== confirmPassword) {
		return { valid: false, error: 'Passwords do not match' };
	}

	return { valid: true };
}

// ===========================================
// TEXT VALIDATION
// ===========================================

/**
 * Validate required text field
 */
export function validateRequired(
	value: string,
	fieldName: string = 'This field'
): ValidationResult {
	if (!value || value.trim() === '') {
		return { valid: false, error: `${fieldName} is required` };
	}
	return { valid: true };
}

/**
 * Validate text length
 */
export function validateLength(
	value: string,
	minLength: number,
	maxLength: number,
	fieldName: string = 'This field'
): ValidationResult {
	const length = value.trim().length;

	if (length < minLength) {
		return { valid: false, error: `${fieldName} must be at least ${minLength} characters` };
	}

	if (length > maxLength) {
		return { valid: false, error: `${fieldName} must be under ${maxLength} characters` };
	}

	return { valid: true };
}

/**
 * Validate name (letters, spaces, hyphens, apostrophes)
 */
export function validateName(name: string, fieldName: string = 'Name'): ValidationResult {
	const required = validateRequired(name, fieldName);
	if (!required.valid) return required;

	const trimmed = name.trim();

	if (trimmed.length > INPUT_LIMITS.NAME) {
		return { valid: false, error: `${fieldName} must be under ${INPUT_LIMITS.NAME} characters` };
	}

	// Allow letters, spaces, hyphens, apostrophes, and common diacritics
	const nameRegex = /^[\p{L}\p{M}' -]+$/u;
	if (!nameRegex.test(trimmed)) {
		return { valid: false, error: `${fieldName} contains invalid characters` };
	}

	return { valid: true };
}

// ===========================================
// FORM VALIDATION HELPERS
// ===========================================

export type Validator<T> = (value: T) => ValidationResult;

/**
 * Chain multiple validators together
 * Returns first error encountered or valid result
 */
export function chainValidators<T>(...validators: Validator<T>[]): Validator<T> {
	return (value: T) => {
		for (const validator of validators) {
			const result = validator(value);
			if (!result.valid) {
				return result;
			}
		}
		return { valid: true };
	};
}

/**
 * Create a validator that only runs if value is not empty
 * Useful for optional fields
 */
export function optionalValidator<T>(validator: Validator<T>): Validator<T> {
	return (value: T) => {
		// If value is empty string or null/undefined, it's valid (optional)
		if (value === '' || value === null || value === undefined) {
			return { valid: true };
		}
		return validator(value);
	};
}

/**
 * Real-time validation state manager
 * Tracks touched fields and shows errors only after interaction
 */
export function createFormState<T extends Record<string, unknown>>(initialValues: T) {
	let values = { ...initialValues };
	const touched: Set<keyof T> = new Set();
	const errors: Partial<Record<keyof T, string>> = {};

	return {
		/**
		 * Get current values
		 */
		get values() {
			return values;
		},

		/**
		 * Get errors for touched fields only
		 */
		get visibleErrors() {
			const visible: Partial<Record<keyof T, string>> = {};
			for (const key of touched) {
				if (errors[key]) {
					visible[key] = errors[key];
				}
			}
			return visible;
		},

		/**
		 * Get all errors (even untouched)
		 */
		get allErrors() {
			return { ...errors };
		},

		/**
		 * Check if form is valid
		 */
		get isValid() {
			return Object.keys(errors).length === 0;
		},

		/**
		 * Update a field value
		 */
		setValue<K extends keyof T>(key: K, value: T[K]) {
			values[key] = value;
		},

		/**
		 * Mark a field as touched
		 */
		touch(key: keyof T) {
			touched.add(key);
		},

		/**
		 * Set error for a field
		 */
		setError(key: keyof T, error: string | undefined) {
			if (error) {
				errors[key] = error;
			} else {
				delete errors[key];
			}
		},

		/**
		 * Reset form state
		 */
		reset() {
			values = { ...initialValues };
			touched.clear();
			Object.keys(errors).forEach((key) => delete errors[key as keyof T]);
		}
	};
}
