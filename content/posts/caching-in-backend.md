---
title: "Caching in backend: why, when, and how"
description: "Caching in backend and other systems, advantages, when, how and why to use it."
date: 2023-10-15 12:00:00
tags:
  - Caching
  - NodeJS
  - JavaScript
---

In this post, I’ll explore how application caching can increase application performance and in which case it can be used. There are different kinds of caching:
- Client-side caching
- CDN caching
- Web-server caching
- Database caching
- Application caching

I will explore the last one, caching at the **application level**.\
Worth mentioning, that any decision should be made relative to the needs, if you have an average application with an average load that handles the load perfectly, then adding another layer as a caching will only complicate the program code because every piece of code has to be tested and supported.

## What is caching and when to use
Caching is a process of storing final data separately in a separate memory, in this context,  by final data I mean the kind of data that should be calculated or that needs time to retrieve them. As a result of using caching, we just return the data stored in the cache bypassing all the time needed for calculation.\
For example, the following reasons may increase data calculation time:
- Network latency, if data is located on another host
- Database queries, reducing load on the DB
- Third-party API
- Data calculation time

If you have not often changed resources that are frequently requested, or their calculating or fetching takes time, caching can be a simple and quite powerful technique for improving application performance and response time.

## How it works
To put it simply, the caching process mainly consists of several steps:
1. Check the existence of data in the cache
2. If exists, return the data
3. Otherwise, fetch data from the source

Additionally, the cached data can have an expiration time or time to live (TTL), after which they will be fetched from source data.

## Cache storage
Since caching system needs storage for cache, storage can be located in app memory or outside of app via using databases such as Redis, and the choice depends on several factors:
- in-app storage does not require additional services that need to be deployed and maintained
- in-app storage will be reset after each app restart, because it's within app
- if app has multiple instances, every instance will have its own cache storage
- for serverless apps in-app storage will be useless since every request has its own environment context and one-lifetime
- in the case of very large in-app storage, the app will have to spend some resources on storing and processing the storage, particularly for languages with garbage collectors
- in distributed systems external storage systems such as Redis can replicate data with a master/slave mechanism to implement high-availability

There are no one right way, make decisions as they come, but if your application does not expect huge traffic and storage size, then using application memory will be the optimal option since you will not need to configure, launch, support an additional service for the application.

## Implementation caching in NodeJS

In the simplest way, caching data, without expiration time, can be implemented in a few lines by using a native JS object or Map.
```javascript
const cache = (storage = new Map()) => ({
    set: (key, value) => storage.set(key, value),
    get: (key) => storage.get(key),
    has: (key) => storage.has(key),
    del: (key) => storage.delete(key),
});

module.exports = cache();
```

The following libraries also solve this task, which also provides features such as expiration time, using external storage for cache, etc.
### node-cache library
The [node-cache](https://github.com/node-cache/node-cache) library contains basic cache operation and supports expiration for keys.
It works similarly to my example above

```javascript
const NodeCache = require( "node-cache" );

const myCache = new NodeCache();
myCache.set("myKey", obj, 5); // set expiration time in 5 seconds for key
```
If you need a library that supports external storage, such as Redis, look at [cache-manager](https://www.npmjs.com/package/cache-manager) as an option

### async-cache-dedupe library
The [async-cache-dedupe](https://github.com/mcollina/async-cache-dedupe) defines another way to work with cache through the defined set of functions, includes the function’s arguments in determining the cached value.
It also supports expiration time for cached data, and using internal memory or Redis for storage.

```javascript
import { createCache } from 'async-cache-dedupe';

const cache = createCache({
    ttl: 2, // the maximum time a cache entry can live
    stale: 2, // number of seconds to return data after ttl has expired
    storage: { type: 'memory' }, // internal memory or Redis
});

cache.define('getMockNumber', async (n) => {
    console.log(`Caching value: ${n}`);
    return n;
});

console.log(
    await cache.getMockNumber(1), // the function with arg 1 will be saved in cache
    await cache.getMockNumber(1), // retrieved from cache
    await cache.getMockNumber(2), // the function with arg 2 will be saved in cache
    await cache.getMockNumber(1), // retrieved from cache
);

// NodeJS process output:
// Caching value: 1
// Caching value: 2
// 1 1 2 1
```

## Conclusion
Caching can be a simple way to increase your app performance, if the app has several instances they can use external storage for cache, such as Redis, but it must be applied with care and consideration for your specific use case.
