'use strict'
let Worker = require('../build/worker.js');
let worker = new Worker('tcp://localhost:5671');
let PubSub = require('../build/pubsub-adapter.js');

let queue = require('global-queue');
let pubsubAdapter = new PubSub('tcp://127.0.0.1:5556', 'tcp://127.0.0.1:5555')

queue.addAdapter('task', worker);
queue.addAdapter('event', pubsubAdapter);
console.log('worker ready ', process.pid);
queue.listenTask('task1', (d) => {
  return 'External task result';
});

queue.on('test-event', (d) => {
  console.log(process.pid, 'event data', d);
})