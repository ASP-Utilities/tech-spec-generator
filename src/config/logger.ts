import logger from '@asp-utilities/tooling-react-logger';

// Enable logging in development
// In production, this is typically handled by deployment config
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.localStorage.setItem('aspLoggerEnabled', 'true');
}

// Service name is configured via environment variable:
// VITE_SERVICE_NAME in .env file
// Defaults to 'tech-spec-generator' if not set

export default logger;

