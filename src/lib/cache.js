const store = {}
const CACHE_TTL = 300000

export function getFromCache(key = 'default') {
  const entry = store[key]
  return (entry && Date.now() < entry.expiry) ? entry.data : null
}

export function setCache(key = 'default', data) {
  store[key] = { data, expiry: Date.now() + CACHE_TTL }
}

export function invalidateCache(key) {
  if (key) {
    delete store[key]
  } else {
    Object.keys(store).forEach(k => delete store[k])
  }
}
