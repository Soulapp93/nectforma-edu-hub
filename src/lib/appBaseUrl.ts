/**
 * Base URL used in emails (activation/reset).
 */
export const APP_PUBLISHED_URL = "https://nectforma.com";

export function getAppBaseUrl(): string {
  const origin = window.location.origin;

  if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
    return origin;
  }

  return APP_PUBLISHED_URL;
}
