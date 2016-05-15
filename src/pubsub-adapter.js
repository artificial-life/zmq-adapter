'use strict'

var ZMQSubscriber = require('./subscriber.js');
var ZMQPublisher = require('./publisher.js');


class PubSubAdapter {
	constructor(puburi, suburi) {
		this.pub = new ZMQPublisher(puburi);
		this.sub = new ZMQSubscriber(suburi);
	}
	subscribe(event_name) {
		return this.sub.subscribe(event_name);
	}
	emit(event_name, data) {
		this.pub.emit(event_name, {
			body: data,
			_emitter: process.pid
		});
	}
	onMessage(callback) {
		return this.sub.onMessage(callback);
	}
}


module.exports = PubSubAdapter;
