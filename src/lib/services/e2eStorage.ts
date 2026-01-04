import { env } from '$env/dynamic/public';

export const isE2E = env.PUBLIC_E2E === 'true';

const isBrowser = typeof window !== 'undefined';

export function readStorage<T>(key: string, fallback: T): T {
	if (!isBrowser) return fallback;
	try {
		const raw = localStorage.getItem(key);
		if (!raw) return fallback;
		return JSON.parse(raw) as T;
	} catch {
		return fallback;
	}
}

export function writeStorage<T>(key: string, value: T): void {
	if (!isBrowser) return;
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// Ignore storage write failures in E2E mode.
	}
}

export function removeStorage(key: string): void {
	if (!isBrowser) return;
	try {
		localStorage.removeItem(key);
	} catch {
		// Ignore storage removal failures in E2E mode.
	}
}

export function setCookie(name: string, value: string): void {
	if (!isBrowser) return;
	document.cookie = `${name}=${value}; path=/`;
}

export function clearCookie(name: string): void {
	if (!isBrowser) return;
	document.cookie = `${name}=; path=/; max-age=0`;
}

const E2E_PASSWORD_KEY = 'e2e_password';

export function setE2EPassword(password: string): void {
	writeStorage(E2E_PASSWORD_KEY, { password });
}

export function getE2EPassword(): string | null {
	const stored = readStorage<{ password: string } | null>(E2E_PASSWORD_KEY, null);
	return stored?.password ?? null;
}

export function clearE2EPassword(): void {
	removeStorage(E2E_PASSWORD_KEY);
}
