'use strict'

let child_process = require('child_process');

setTimeout(() => child_process.fork('./build/broker-thread.js'), 10);
setTimeout(() => child_process.fork('./build/test.js'), 1000);
setTimeout(() => child_process.fork('./build/test2.js'), 1500);