'use strict'

var zmq = require('zmq');

class ZMQSubscriber {
	constructor(uri) {
		this.sock = zmq.socket('sub');
		this.sock.connect(uri);
		this.sock.on('message', (d) => this.handleEvent(d));
	}
	handleEvent(d) {
		let data = d.toString('utf8');
		let pos = data.indexOf(' ');
		if (-1 == pos) throw new Error('wrong event format');

		let event_name = data.slice(0, pos);
		let payload = JSON.parse(data.slice(pos + 1));
		if (payload._emitter == process.pid) return true;

		let event_data = payload.body;
		this.callback && this.callback(event_name, event_data);
	}
	onMessage(callback) {
		this.callback = callback;
	}
	subscribe(event_name) {
		this.sock.subscribe(event_name);
	}
}

module.exports = ZMQSubscriber;
