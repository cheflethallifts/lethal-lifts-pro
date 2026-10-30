const CACHE_PREFIX = 'lethal_cache_';
const LAST_USER_KEY = `${CACHE_PREFIX}last_user`;

// localStorage holds about 5MB per site, and this comfortably fits a year or two of
// heavy logging. Older sets stay in the cloud and simply aren't available offline.
export const MAX_CACHED_HISTORY_ROWS = 10000;

const coreKey = (userId) => `${CACHE_PREFIX}${userId}_core`;
const historyKey = (userId) => `${CACHE_PREFIX}${userId}_history`;

const readJson = (key) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (e) {
    return null;
  }
};

export const saveCloudCache = (user, { globalHistory, ...core }) => {
  try {
    localStorage.setItem(LAST_USER_KEY, JSON.stringify({ id: user.id, email: user.email }));
    localStorage.setItem(coreKey(user.id), JSON.stringify(core));
  } catch (e) {
    console.warn("Couldn't cache app data:", e);
  }

  // History is stored separately so running out of room only costs offline history
  try {
    localStorage.setItem(historyKey(user.id), JSON.stringify(globalHistory.slice(-MAX_CACHED_HISTORY_ROWS)));
  } catch (e) {
    console.warn("Couldn't cache workout history:", e);
    try { localStorage.removeItem(historyKey(user.id)); } catch (removeError) { /* storage unavailable */ }
  }
};

export const loadCloudCache = (userId) => {
  const core = readJson(coreKey(userId));
  if (!core) return null;
  return { ...core, globalHistory: readJson(historyKey(userId)) ?? [] };
};

// The account to reopen when the app can't reach the server to refresh an expired login.
export const loadLastUser = () => readJson(LAST_USER_KEY);

export const clearCloudCache = () => {
  try {
    Object.keys(localStorage)
      .filter(key => key.startsWith(CACHE_PREFIX))
      .forEach(key => localStorage.removeItem(key));
  } catch (e) {
    console.warn("Couldn't clear cached app data:", e);
  }
};
