const MemcachePlus = require("./lib");

const environment = "production";
const noMemcache = false;
const inMemoryCache = {};
const Cache = noMemcache
  ? null
  : new MemcachePlus({
      hosts: null,
      poolSize: 1,
    });

const serializeDateTime = function (obj) {
  if (!obj) {
    return;
  }

  Object.keys(obj).forEach((key) => {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (value && value instanceof Date) {
        obj[key] = { _serializedDate: value.getTime() / 1000 };
      }
    }
  });
};

const deserializeDateTime = function (obj) {
  if (!obj) {
    return;
  }

  Object.keys(obj).forEach((key) => {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (value && value._serializedDate) {
        const date = new Date(value._serializedDate * 1000);
        obj[key] = date;
      }
    }
  });
};

const getCacheKey = function (key, scope, environmentOverride) {
  return `${environmentOverride || environment}|${key}|${scope}`;
};

const getValue = async function (key, scope, environmentOverride = null) {
  const cacheKey = getCacheKey(key, scope, environmentOverride);

  if (noMemcache) {
    const result = await Promise.resolve(inMemoryCache[cacheKey]);
    deserializeDateTime(result);
    return result;
  } else {
    let result;

    try {
      // const hrtime = process.hrtime();

      result = await Cache.get(cacheKey);

      // const [seconds, nanoseconds] = process.hrtime(hrtime);
      // const executionDurationMs = seconds * 1000 + nanoseconds / 1e6;
      // console.log(`Reading from memcached took ${executionDurationMs.toFixed(2)}ms`);
    } catch (error) {
      console.error(
        `[memcached][getValue] failed to get value from memcached key: ${cacheKey}, error: ${error.message}`
      );
      return null;
    }

    deserializeDateTime(result);

    return result;
  }
};

const getValues = async function (keys, scope, environmentOverride = null) {
  let cachedValues;

  if (noMemcache) {
    cachedValues = inMemoryCache;
  } else {
    const cacheKeys = keys.map((key) => getCacheKey(key, scope, environmentOverride));
    try {
      cachedValues = await Cache.getMulti(cacheKeys);
    } catch (error) {
      console.error(`[memcached][getValues] failed to getMulti: ${error.message}`);
      return null;
    }
  }

  const result = {};

  keys.forEach((key) => {
    const cacheKey = getCacheKey(key, scope, environmentOverride);
    const value = cachedValues[cacheKey];
    if (value) {
      deserializeDateTime(value);
      result[key] = value;
    }
  });

  return result;
};

const setValue = async function (key, scope, value, environmentOverride = null, ttl = 0) {
  const cacheKey = getCacheKey(key, scope, environmentOverride);

  serializeDateTime(value);

  if (noMemcache) {
    // Let's simulate that the data is being stored in the actual memcached. This
    // is required for testing the actual behavior of objects being stored in cache.
    // If we just insert the object in memory, when we get the data and updated it
    // we'll be changing the underlying in-memory javascript object reference.
    // A straightforward Object.assign({}, value) will not work because it'll only work for
    // first-level props, and there's some nested objects (JS dates for example) that won't be
    // copied properly. This is why we need to cast to string and back to object.
    const valueString = JSON.stringify(value);
    inMemoryCache[cacheKey] = JSON.parse(valueString);
    return null;
  } else {
    try {
      // const hrtime = process.hrtime();

      await Cache.set(cacheKey, value, ttl);

      // const [seconds, nanoseconds] = process.hrtime(hrtime);
      // const executionDurationMs = seconds * 1000 + nanoseconds / 1e6;
      // console.log(`Writing to memcached took ${executionDurationMs.toFixed(2)}ms`);
    } catch (error) {
      console.error(`[memcached][setValue] failed to save value on memcached: ${error?.message}`);
      return null;
    }

    return null;
  }
};

const appendValue = async function (key, scope, value, environmentOverride = null) {
  const cacheKey = getCacheKey(key, scope, environmentOverride);
  const ttl = 0; // Set the ttl to 0 explicitly just to be safe.

  serializeDateTime(value);

  if (noMemcache) {
    if (inMemoryCache[cacheKey] !== undefined && inMemoryCache[cacheKey] !== null) {
      inMemoryCache[cacheKey] = `${inMemoryCache[cacheKey]}${value}`;
    }
    return Promise.resolve(null);
  } else {
    try {
      await Cache.append(cacheKey, value, ttl);
    } catch (error) {
      console.error(`[memcached][setValue] failed to append value on memcached: ${error?.message}`);
      return null;
    }

    return null;
  }
};

const incrementValue = async function (key, scope, value = 1, environmentOverride = null) {
  if (isNaN(value)) {
    return false;
  }

  const cacheKey = getCacheKey(key, scope, environmentOverride);

  if (noMemcache) {
    if (!isNaN(inMemoryCache[cacheKey])) {
      inMemoryCache[cacheKey] = Number(inMemoryCache[cacheKey]) + Number(value);
    }
    return null;
  } else {
    if (Number(value) < 0) {
      // If incrementValue is called with a negative value, then use decr.
      try {
        await Cache.decr(cacheKey, Number(value));
      } catch (error) {
        console.error(`[memcached][incrementValue] failed to decr value on memcached: ${error?.message}`);
      }

      return null;
    }

    try {
      await Cache.incr(cacheKey, Number(value));
    } catch (error) {
      console.error(`[memcached][incrementValue] failed to incr value on memcached: ${error?.message}`);
    }

    return null;
  }
};

module.exports.getValue = getValue;
module.exports.getValues = getValues;
module.exports.setValue = setValue;
module.exports.appendValue = appendValue;
module.exports.incrementValue = incrementValue;
