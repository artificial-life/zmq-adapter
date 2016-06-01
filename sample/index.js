'use strict'

let child_process = require('child_process');

setTimeout(() => child_process.fork('./sample/broker-thread.js'), 10);
setTimeout(() => child_process.fork('./sample/test.js'), 1000);
setTimeout(() => child_process.fork('./sample/test2.js'), 1500);