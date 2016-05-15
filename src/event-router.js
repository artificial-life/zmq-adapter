'use strict'

let zmq = require('zmq');

class EventRouter {
	constructor(pubListener, subListener) {
		this.subSock = zmq.socket('xsub');
		this.subSock.identity = 'subscriber' + process.pid;
		this.pubSock = zmq.socket('xpub');
		this.pubSock.identity = 'publisher' + process.pid;

		this.subSock.bindSync(subListener);
		this.pubSock.bindSync(pubListener);

		this.subSock.on('message', (data) => {
			// console.log('routing event data', data);
			this.pubSock.send(data);
		});

		this.pubSock.on('message', (data) => {
			var type = data[0] === 0 ? 'unsubscribe' : 'subscribe';
			var channel = data.slice(1).toString();
			console.log(type + ':' + channel);
			this.subSock.send(data);
		});
	}
	setsockopt(socket_name, opt, value) {
		if (socket_name == 'pub') {
			this.pubSock.setsockopt(zmq[opt], value);
		} else {
			this.subSock.setsockopt(zmq[opt], value);
		}
	}
}

module.exports = EventRouter;