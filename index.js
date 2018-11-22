const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");

// cacheThunk takes in a cache key and a function that returns a promise (a thunk)
// it will check on disk for a file matching url
// if found, it will return a promise resolving to that file
// if not, it will run the thunk, resolve the promise it returns, write the promise to a cache file at url, and then return the promise result
// this is useful for doing quick data exploration where you quickly iterate on the data-munging code, but don't want to wait for requests to finish every time
// use like this:
//    const url = "https://example.com/slow-api-request"
//    const results = await cacheThunk(url, () => fetch(url).then(res => res.json))
//    // your results are now cached on disk at `cache/${url}/`, and will load from disk next time instead of running the thunk
// why a thunk? because we need to control when it gets evaluated!
module.exports = async function cacheThunk(
  url,
  fn,
  options = { skipCache: false, cachePath: path.join(__dirname, "..", "cache") }
) {
  if (!options.cachePath) {
    throw new Error("Must provide a cache path!");
  }

  // skip caching if we have opted out
  if (options.skipCache) {
    return fn();
  }
  const cachePath = options.cache;
  const filePath = path.join(cachePath, encodeURIComponent(url));

  mkdirp.sync(cachePath);

  try {
    const buffer = fs.readFileSync(filePath, { encoding: "utf8" });
    return JSON.parse(buffer);
  } catch (e) {
    const res = await fn();
    fs.writeFileSync(filePath, JSON.stringify(res));
    return res;
  }
};
