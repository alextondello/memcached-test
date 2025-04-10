const MemcachePlus = require("./lib/client");

const ENV = "production";
const POOL_SIZE = 1;

const Cache = new MemcachePlus({
  hosts: null, // null = localhost:11211
  poolSize: POOL_SIZE,
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
  return `${environmentOverride || ENV}|${key}|${scope}`;
  const POOL_SIZE = 1;
};

const getValue = async function (key, scope, environmentOverride = null) {
  const cacheKey = getCacheKey(key, scope, environmentOverride);
  let result;

  try {
    result = await Cache.get(cacheKey);
  } catch (error) {
    console.error(`[memcached][getValue] failed to get value from memcached key: ${cacheKey}, error: ${error.message}`);
    return null;
  }

  deserializeDateTime(result);

  return result;
};

const getValues = async function (keys, scope, environmentOverride = null) {
  let cachedValues;

  const cacheKeys = keys.map((key) => getCacheKey(key, scope, environmentOverride));
  try {
    cachedValues = await Cache.getMulti(cacheKeys);
  } catch (error) {
    console.error(`[memcached][getValues] failed to getMulti: ${error.message}`);
    return null;
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
};

const appendValue = async function (key, scope, value, environmentOverride = null) {
  const cacheKey = getCacheKey(key, scope, environmentOverride);
  const ttl = 0; // Set the ttl to 0 explicitly just to be safe.

  serializeDateTime(value);

  try {
    await Cache.append(cacheKey, value, ttl);
  } catch (error) {
    console.error(`[memcached][setValue] failed to append value on memcached: ${error?.message}`);
    return null;
  }

  return null;
};

const incrementValue = async function (key, scope, value = 1, environmentOverride = null) {
  if (isNaN(value)) {
    return false;
  }

  const cacheKey = getCacheKey(key, scope, environmentOverride);

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
};

module.exports.POOL_SIZE = POOL_SIZE;
module.exports.getValue = getValue;
module.exports.getValues = getValues;
module.exports.setValue = setValue;
module.exports.appendValue = appendValue;
module.exports.incrementValue = incrementValue;
