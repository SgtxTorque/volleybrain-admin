// CJS preload script: patches dns.lookup to use Google DNS (8.8.8.8)
const dns = require('dns')
const { Resolver } = require('dns')

const resolver = new Resolver()
resolver.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1'])

const cache = new Map()
const origLookup = dns.lookup

dns.lookup = function patchedLookup(hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }
  if (typeof options === 'number') {
    options = { family: options }
  }

  const family = options?.family || 0

  if (cache.has(hostname)) {
    const ip = cache.get(hostname)
    if (options?.all) {
      return process.nextTick(() => callback(null, [{ address: ip, family: 4 }]))
    }
    return process.nextTick(() => callback(null, ip, 4))
  }

  resolver.resolve4(hostname, (err, addresses) => {
    if (!err && addresses && addresses.length > 0) {
      cache.set(hostname, addresses[0])
      if (options?.all) {
        callback(null, addresses.map(a => ({ address: a, family: 4 })))
      } else {
        callback(null, addresses[0], 4)
      }
    } else {
      origLookup.call(dns, hostname, options, callback)
    }
  })
}
