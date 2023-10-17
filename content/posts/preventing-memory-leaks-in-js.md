---
title: "Preventing memory leaks in JavaScript and NodeJS"
description: "Why memory leaks occur in JavaScript and NodeJS and how to prevent them. Examples and practices for managing memory."
date: 2023-10-02 12:00:00
tags:
  - JavaScript
  - NodeJS
  - Troubleshooting
---
Memory leaks are one of the most common issues in JavaScript applications. Let’s explore why and in which cases memory leaks can occur.

## What is the memory leaks?
It’s a state when the memory that was allocated for data continues to stay in program memory after finishing part of the code in which it was used, as a result, the allocated memory stays in memory forever and reduces the program performance.

## Why memory leaks occur?
Garbage Collector (GC) is a program that removes the allocated memory for data when data is no longer needed, if data hasn’t any reference in the code, it means it’s not used in the program so it will be deleted by GC.

## Memory Leak Examples
To illustrate memory leaks in my examples I will use the following code that logs usage memory in the app and prints it to the console.

```javascript
const process = require('node:process');

const byteToMb = b => b / Math.pow(1000, 2);
const processStartTime = Date.now();
const memoryStates = [];

const logUsageMemory = () => {
    const memoryUsage = process.memoryUsage();
    memoryStates.push({
        rss: byteToMb(memoryUsage.rss), // resident set size, the amount of space for the process
        heapTotal: byteToMb(memoryUsage.heapTotal),
        heapUsed: byteToMb(memoryUsage.heapUsed),
        external: byteToMb(memoryUsage.external),
        arrayBuffers: byteToMb(memoryUsage.arrayBuffers),
        processTime: Date.now() - processStartTime,
    });
    console.clear();
    console.table(memoryStates);
}
```

### Unused variable and reference
Mostly JavaScript Garbage Collector can release an allocated memory for unused variables and references. Still, GC can’t do it when the variable’s reference is implicitly used somewhere. In this case each defined variable should be properly released.
For instance, let’s run the following code with an unused variable:
```javascript
logUsageMemory();
const bigUnusedArray = new Array(10000000);
setInterval(logUsageMemory, 1000);
```
Let’s see the memory usage:

| (index) | rss           | heapTotal | heapUsed  | external | processTime |
|---------|---------------|-----------|-----------|----------|-------------|
| 0       | 39.829504     | 6.144     | 5.438736  | 0.42528  | 0           |
| 1       | 120.324096    | 86.4256   | 85.73308  | 0.432207 | 1014        |
| 2       | 120.455168    | 86.4256   | 85.75972  | 0.432207 | 2015        |
| 3       | 120.717312    | 86.4256   | 85.793944 | 0.432207 | 3017        |
| 4       | 120.897536    | 86.4256   | 85.836576 | 0.432207 | 4017        |
| 5       | 121.044992    | 86.4256   | 85.88696  | 0.432207 | 5018        |
| 6       | 121.110528    | 86.4256   | 85.946216 | 0.432207 | 6020        |
| **7**   | **42.156032** | 7.733248  | 5.710688  | 0.432207 | 7021        |
| 8       | 42.254336     | 7.733248  | 5.78564   | 0.432207 | 8021        |
| 9       | 42.123264     | 6.684672  | 4.808304  | 0.429845 | 9023        |

In this case, at 7 seconds process running the GC released the memory for unused variables.

### Unused Circular References
The oldest JS Garbage Collectors (pre-2012) used the reference-counting algorithm, which counts the number of references on a variable to determine remove allocated memory to data or not, the disadvantage of this algorithm is that it can’t resolve the circular references between data, to resolve this issue this algorithm was replace to the mark-and-sweep algorithm.
Memory in the next code will be released by GC:
```javascript
logUsageMemory();
const obj1 = { ref: null, arr: new Array(10000000) };
const obj2 = { ref: obj1, arr: new Array(10000000) };
obj1.ref = obj2;
setInterval(logUsageMemory, 1000);
```

Memory usage (output from logUsageMemory):

| (index) | rss        | heapTotal  | heapUsed   | external | processTime |
|---------|------------|------------|------------|----------|-------------|
| 0       | 37.912576  | 6.144      | 5.438736   | 0.42528  | 0           |
| 1       | 199.688192 | 167.493632 | 165.447256 | 0.432207 | 1058        |
| 2       | 200.015872 | 167.493632 | 165.474112 | 0.432207 | 2059        |
| 3       | 200.37632  | 167.77216  | 165.77076  | 0.432207 | 3060        |
| 4       | 200.441856 | 167.77216  | 165.813504 | 0.432207 | 4061        |
| 5       | 200.589312 | 167.77216  | 165.863984 | 0.432207 | 5063        |
| 6       | 200.654848 | 167.77216  | 165.923272 | 0.432207 | 6063        |
| 7       | 200.720384 | 167.77216  | 165.989872 | 0.432207 | 7065        |
| 8       | 200.802304 | 167.77216  | 166.064688 | 0.432207 | 8067        |
| 9       | 40.402944  | 6.684672   | 4.808632   | 0.429845 | 9068        |
| 10      | 40.484864  | 6.684672   | 4.966584   | 0.429845 | 10069       |


This is especially true if the variable was defined in a global scope or in long-living functions.
Why did I mention functions? Because in this case, the garbage collector will release the memory that was allocated within a function when the function finishes executing.
However, I provided the next cases where memory leaks can still occur within a function.

### Global Variables
Worth mentioning, that GC will not release memory for unused property of objects due to its use of the mark-and-sweep algorithm.

```javascript
const obj1 = { type: 1,  payload: new Array(10000000) };
setInterval(() => {
    console.log(obj1.type); // using one property from the object, GC won't release memory that was allocated for the payload property
    logUsageMemory();
}, 1000);
```

That's why, if you set data to global scope, it always will be in global scope, because global scope is a JS object. In NodeJS global scope can be accessed from the variable global, and from the variable window in browsers.

```javascript
global.userPayload = { type: 1,  payload: new Array(10000000) };
```

To release the memory property should be removed from the object manually.

### References inside a closure
In a similar case with references inside a closure. When we access variables declared at a higher level inside a closure, it creates a reference on the variable, and we need to properly remove this reference or variable.
```javascript
function createClosure() {
   const data = { /* a large object */ };
   return () => {
     console.log(data); // reference created
   }
};
const printData = createClosure();
// … using the printData closure somewhere
```
Reference will be automatically removed by the garbage collector if it doesn’t have any other references to itself out of scope, or to remove the reference we can assign a null to variable printData.
One of the most common cases where this error occurs is in listeners that, reviewed below

Incorrect removing the event listener
The common case of memory leaking in listeners is when the listener was not properly removed, and closure keeps references to internal or external objects.
```javascript
const { EventEmitter } = require('node:events');
const eventEmitter = new EventEmitter();
const setupListener = () => {
    const obj1 = new Array(10000000);
    const processExited = () => console.log(obj1);
    eventEmitter.on('someEvent', processExited);
    // We need to call the removeListener when done, otherwise, variable obj1 will stay in memory
    // eventEmitter.removeListener('someEvent', processExited);
}
setupListener();
```

Pay attention, even if you remove the emitter object (customEventEmitter in the example) without removing the listener via removeListener, the listener won’t be removed.

An example just with the front-end and registering listener via HTML element, even if element will be removed, the listeners continue to stay at memory:
```javascript
const data = { /* Large object */ };
const eventListener = () => { console.log(data); }; // the variable captured in a closure,
element.addEventListener("customEvent", eventListener);

// We need to call the removeEventListener when done,
// just removing “element” will not remove the listener
// customEventEmitter.removeEventListener(“customEvent”, eventListener);
```

### Timers and Intervals
The next obvious case of memory leaking is not removing the timers or intervals when work is done. Moreover, this kind of issue can be not only the reason of memory leaking but also leaking other resources, depepnds on your interval function.
```javascript
const intervalId = setInterval(intervalListener, 1000);
// if you forget to call clearInterval(intervalId), function “intervalListener” keeps running
```

### Unclosed File Handles

The next case occurs typically when you open files but do not close them properly. Memory leaks with file streams happen because an open file stream holds resources in memory, such as file descriptors and buffers, and if you don't close the stream when you're done with it, these resources are not released.

```javascript
const stream = fs.createReadStream(__filename, () => {});
stream.on('data', (chunk) => { /* Do something with the data */ });
// Close the file stream when done
// stream.on('end', () => stream.close() );
```

### Unclosed Network Connections
Memory leaks with unclosed network connections in Node.js can occur when you open network sockets or connections, such as HTTP requests, but didn’t close them properly.

```javascript
const http = require('node:http');
 const req = http.request({
    hostname: 'www.google.com',
    port: 80,
    method: 'GET',
}, (res) => {
    res.on('data', () => { /* do something with data */  });
    // Connection should be closed properly
    // res.on('end', () => req.end());
});
```

### Conclusion
Understanding and addressing memory leaks in JavaScript applications is crucial for maintaining their performance and resource efficiency.
By recognizing the various scenarios that can lead to memory leaks and taking proactive steps to mitigate them, you can ensure your applications run smoothly and efficiently, providing a better user experience and avoiding potential issues down the line.

To prevent memory leaks in JavaScript applications, follow practices which I discussed above:
- Clear unused variables and references.
- Handle circular references carefully.
- Manually remove global object properties.
- Manage references within closures effectively.
- Remove unnecessary event listeners.
- Clear timers and intervals when finished.
- Close file streams properly.
- Terminate unclosed network connections.
