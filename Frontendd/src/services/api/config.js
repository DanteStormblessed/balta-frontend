const DEFAULT_BASE_URL = 'https://gestion-balta-fchef0bycdbef7fr.chilecentral-01.azurewebsites.net/api';

const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, '');

export { API_BASE_URL };