const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");

interface Options {
  skipCache?: boolean;
  cachePath: string;
}

/*
 cacheThunk takes in a cache key and a function that returns a promise (a thunk)

 It will check on disk for a file matching the cache key.
 If found, it will return a promise resolving to that file.
 If not, it will run the thunk, resolve the promise it returns, write the promise to a cache file at url, and then return the promise result.

 This is useful for doing quick data exploration where you quickly iterate on the data-munging code, but don't want to wait for requests to finish every time
use like this:
    const url = "https://example.com/slow-api-request"
    const results = await cacheThunk(url, () => fetch(url).then(res => res.json))
    // your results are now cached on disk at `cache/${url}/`, and will load from disk next time instead of running the thunk
*/
export default async function cacheThunk<T>(
  url: string,
  fn: () => Promise<T>,
  options: Options = {
    skipCache: false,
    cachePath: path.join(__dirname, "..", "cache")
  }
): Promise<T> {
  if (!options.cachePath) {
    throw new Error("Must provide a cache path!");
  }
  const cachePath = options.cachePath;

  // skip caching if we have opted out
  if (options.skipCache) {
    return fn();
  }

  const filePath = path.join(cachePath, encodeURIComponent(url));

  // ensure cache directory exists
  mkdirp.sync(cachePath);

  try {
    // try to load from cache
    const buffer = fs.readFileSync(filePath, { encoding: "utf8" });
    return JSON.parse(buffer);
  } catch (e) {
    // if loading from cache failed, assume it's b/c the file is missing
    // run the thunk, write it to cache, return the result
    const res = await fn();
    fs.writeFileSync(filePath, JSON.stringify(res));
    return res;
  }
}
