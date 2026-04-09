/**
 * Production console silencer.
 * In production, suppress console.log, console.debug, console.info
 * to avoid information leakage and reduce noise.
 * Only console.warn and console.error are kept for critical issues.
 *
 * Import this file once at the top of main.tsx.
 */

if (!import.meta.env.DEV) {
  const noop = () => {};
  console.log = noop;
  console.debug = noop;
  console.info = noop;
  // console.warn and console.error are preserved for critical issues
}
