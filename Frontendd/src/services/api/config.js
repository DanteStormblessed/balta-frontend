const PROD_FALLBACK_BASE_URL = 'https://gestion-balta-fchef0bycdbef7fr.chilecentral-01.azurewebsites.net/api';

const isBrowser = typeof window !== 'undefined';
const isDev = Boolean(import.meta.env?.DEV);

// En desarrollo, permite usar el mismo origen (útil con proxy/rewrite en local).
// En producción, NO debe apuntar al dominio del frontend.
const DEFAULT_BASE_URL = isDev && isBrowser && window.location?.origin
	? `${window.location.origin}/api`
	: PROD_FALLBACK_BASE_URL;

const envBaseUrl = import.meta.env?.VITE_API_BASE_URL;

const isRunningOnLocalhost = isBrowser
	? ['localhost', '127.0.0.1'].includes(window.location.hostname)
	: false;

const envLooksLikeLocalhost = typeof envBaseUrl === 'string'
	? /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(envBaseUrl.trim())
	: false;

// Evita que un build deployado apunte a localhost por error.
const selectedBaseUrl = (!isRunningOnLocalhost && envLooksLikeLocalhost)
	? DEFAULT_BASE_URL
	: (envBaseUrl ?? DEFAULT_BASE_URL);

const API_BASE_URL = String(selectedBaseUrl).replace(/\/$/, '');

export { API_BASE_URL };