'use strict'

let _ = require('lodash');
let zmq = require('zmq');
let RequestPool = require('async-requests').RequestPool;

class Worker {
	constructor(uri) {
		this.worker = zmq.socket('dealer');
		this.worker.identity = 'zmq-worker-' + process.pid;
		this.worker.connect(uri);
		this.worker.on('message', (...args) => this.handleMessage(args));
		this.pool = new RequestPool('cycle', 100000);

		this.callbacks = {};
	}
	handleResponse(data) {
		this.pool.handleRequest(data);
	}
	makeResponse(recipient, request_id, data) {
		this.send({
			type: 'responseTask',
			body: data,
			_recipient: recipient,
			request_id: request_id
		});
	}
	handleMessage(args) {
		let payload = JSON.parse(args[1]);
		let {
			body: {
				taskname: taskname,
				params: params,
			},
			type: type,
			request_id: request_id,
			_sender: sender
		} = payload;

		if (type == 'responseTask') {
			return this.handleResponse(payload);
		}

		let cb = this.callbacks[taskname];
		let result = cb(params);
		Promise.resolve(result).then((d) => this.makeResponse(sender, request_id, d));
	}
	send(message) {
		this.worker.send(['', JSON.stringify(message)])
	}
	addTask(taskname, params) {
		let request = this.pool.createRequest();

		this.send({
			type: 'addTask',
			body: {
				params,
				taskname
			},
			request_id: request.id
		});

		return request.promise;
	}
	listenTask(taskname, callback) {
		this.send({
			type: 'listenTask',
			body: taskname
		});
		this.callbacks[taskname] = callback;
	}
}

module.exports = Worker;
