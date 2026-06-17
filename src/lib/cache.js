const cache = { data: null, expiry: 0 }
const CACHE_TTL = 300000

export function getFromCache() {
  return (Date.now() < cache.expiry) ? cache.data : null
}

export function setCache(data) {
  cache.data = data
  cache.expiry = Date.now() + CACHE_TTL
}

export function invalidateCache() {
  cache.data = null
  cache.expiry = 0
}
