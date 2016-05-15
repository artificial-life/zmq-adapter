'use strict'
let queue = require('global-queue');

let Worker = require('./worker.js');
let PubSub = require('./pubsub-adapter.js');

let taskAdapter = new Worker('tcp://localhost:5671');
let pubsubAdapter = new PubSub('tcp://127.0.0.1:5556', 'tcp://127.0.0.1:5555')

queue.addAdapter('task', taskAdapter);
queue.addAdapter('event', pubsubAdapter);

queue.listenTask('other', (d) => {
	return 'other'
})

queue.addTask('task1', {
	p: 1
}).then((d) => console.log(process.pid, d));

queue.addTask('other', {
	p: 1
}).then((d) => console.log(process.pid, d));

queue.on('test-event', (d) => {
	console.log(process.pid, 'rec event internal', d);
});

setTimeout(() => {
	console.log(process.pid, 'emiting event');
	queue.emit('test-event', {
		test: 'data'
	});
}, 3000)
