# cache-thunk
## 💵🤔

cache-thunk is a library that caches potentially slow operations (thunks) to disk.

I often write little scripts that fetch a bunch of data and transform it for analysis. My workflow used to look like this:

0. write data fetching code
0. write data transformation code
0. re-run script, tweaking transformation code

This is painful, since every time I re-run the script, I wait for expensive slow HTTP requests to re-fetch the same data. cache-thunk speeds up that part, making it faster for me to iterate on the data transformation code. Behold, an example!

## Example

```javascript
const cacheThunk = require('cache-thunk');
const fetch = require('node-fetch');

const url = "http://example.com/giant-slow-request";
const thunk = () => fetch(url).then(res => res.json());
// the first time this runs, it will make a request to http://example.com/giant-slow-request
// and save the results to disk
// the second time it runs, it'll just read the file from disk, so it should run
// much faster!
cacheThunk(url, thunk)
  .then(results => console.log("got my data back!");
```


## API

TypeScript definition if it helps:
`cacheThunk<T>(cacheKey: string, thunk: () => Promise<T>, options?: { skipCache: boolean, cachePath: string } = { skipCache: false, cachePath: '../cache' }) : Promise<T>`

`cacheThunk` looks for a cache file named `cacheKey`. If found, it'll skip executing the thunk and just return the contents of the file. If it doesn't find the cache file, it'll execute the thunk, write the resulting value in to the cache file, and then return the value.

* `cacheKey` - filename of the cache for this thunk. It'll be URL-encoded so it should be a valid file path
* `thunk` - a function that takes no arguments and returns a promise. The results of this function will be `JSON.stringify`-d and saved to disk if the cache file isn't found
* `options` - an object with 


## What is a thunk?
A [thunk](https://en.wikipedia.org/wiki/Thunk) is a function that takes no arguments that someone else runs for you. It lets you hand someone else a function for them to execute later. Since it takes no arguments, anyone can execute it! This is useful for delaying computation or side-effects until later, or letting someone wrap operations around the function, like in our case.

Thunks show up in React's [`useEffect`](https://reactjs.org/docs/hooks-reference.html#useeffect) hook - the function you pass to `useEffect` is a thunk. React will call your thunk for you at the right time, delaying executing the side-effect until

