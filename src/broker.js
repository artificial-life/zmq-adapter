'use strict';

let zmq = require('zmq');
let _ = require('lodash');


let taskmap = {};
let cursors = {};

class Broker {
	constructor(uri) {
		this.broker = zmq.socket('router');
		// console.log('Broker on %s', uri);
		this.broker.bindSync(uri);
		this.broker.on('message', (...args) => this.handleMessage(args));
	}
	handleMessage(args) {
		let identity = args[0].toString('utf8');
		let payload = JSON.parse(args[2].toString('utf8'));
		// console.log('Broker payload', payload);

		let event_name = 'on' + payload.type;
		let eventHandler = this[event_name];
		//@NOTE: do checks here
		eventHandler.call(this, identity, payload);
	}
	ready(identity, payload) {
		_.forEach(payload.body, task => this.listenTask(identity, task));
	}
	onresponseTask(identity, payload) {
		this.broker.send([payload._recipient, '', JSON.stringify(payload)]);
	}
	onlistenTask(identity, payload) {
		let task = payload.body;
		if (taskmap[task]) {
			taskmap[task].push(identity);
			return;
		}
		taskmap[task] = [identity];
		return true;
	}
	onaddTask(identity, payload) {
		let body = payload.body;
		let taskname = body.taskname;
		let free_worker = this.getWorkerForTask(taskname)

		this.sendTask(free_worker, identity, payload);
	}
	getWorkerForTask(taskname) {
		let cursor = cursors[taskname] ? (cursors[taskname] + 1) % cursors[taskname].length : 0;

		return taskmap[taskname][cursor];
	}
	sendTask(free_worker, identity, body) {
		body._sender = identity;
		this.broker.send([free_worker, '', JSON.stringify(body)]);
	}
}

module.exports = Broker;
