import { API_BASE_URL } from '../api';

const SESSION_KEY = 'pf_session_id';

// A random per-tab-session id. No cookies, no fingerprinting, no IP storage -
// just enough to tell "12 views" apart from "12 visitors".
const sessionId = () => {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
};

/**
 * `navigator.sendBeacon` always sends cross-origin requests in credentials
 * mode "include", and a credentialed request is rejected outright when the
 * server answers with `Access-Control-Allow-Origin: *`. Since the portfolio
 * and the API sit on different hosts, a beacon here fails every time.
 * `fetch` with `keepalive` survives page unload the same way and lets us opt
 * out of credentials, which is what makes the wildcard acceptable.
 */
const beacon = (payload) => {
  // DEMO BUILD: there is no analytics backend to receive beacons — the numbers
  // on the Analytics page are synthesized locally — so this is a no-op. Kept as a
  // function (and still minting a session id) so the call sites stay unchanged.
  void API_BASE_URL;
  void payload;
  void sessionId();
};

export const trackPageView = (path) =>
  beacon({
    type: 'pageview',
    path: path || window.location.pathname,
    referrer: document.referrer || '',
  });

export const trackEvent = (name, detail = '') =>
  beacon({
    type: 'event',
    name,
    detail,
    path: window.location.pathname,
  });
