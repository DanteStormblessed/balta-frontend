const DEFAULT_BASE_URL = (typeof window !== 'undefined' && window.location?.origin)
	? `${window.location.origin}/api`
	: 'https://white-pond-0bca16710.2.azurestaticapps.net/api';

const envBaseUrl = import.meta.env?.VITE_API_BASE_URL;

const isRunningOnLocalhost = (typeof window !== 'undefined')
	? ['localhost', '127.0.0.1'].includes(window.location.hostname)
	: false;

const envLooksLikeLocalhost = typeof envBaseUrl === 'string'
	? /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(envBaseUrl.trim())
	: false;

const selectedBaseUrl = (!isRunningOnLocalhost && envLooksLikeLocalhost)
	? DEFAULT_BASE_URL
	: (envBaseUrl ?? DEFAULT_BASE_URL);

const API_BASE_URL = String(selectedBaseUrl).replace(/\/$/, '');

export { API_BASE_URL };