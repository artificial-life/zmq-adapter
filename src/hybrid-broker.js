'use strict'

let _ = require('lodash');

let Broker = require('./broker.js');
let RequestPool = require('async-requests').RequestPool;

const HEARTBEAT_INTERVAL = 2000;

class HybridBroker extends Broker {
	constructor(uri) {
		super(uri);
		this.pool = new RequestPool('cycle', 100000);
		this.worker_status = {};
		this.heartbeat_id = setInterval(() => {
			this.heartbeat();
		}, HEARTBEAT_INTERVAL);
	}
	getWorkersCount() {
		return _.size(worker_status);
	}
	heartbeat() {
		_.forEach(this.worker_status, (status, worker_id) => {
			this.addTask('heartbeat', '', worker_id).timeout(1000).catch((e) => this.onstoplistenTask(worker_id, {}));
		});
	}
	onlistenTask(identity, payload) {
		this.worker_status[identity] = true;
		super.onlistenTask(identity, payload);
	}
	onstoplistenTask(identity, payload) {
		!payload.body && _.unset(this.worker_status, identity); //@NOTE: removing worker from list
		super.onstoplistenTask(identity, payload);
	}
	onresponseTask(identity, payload) {
		payload._recipient != 'self' ? super.onresponseTask(identity, payload) : this.pool.handleRequest(payload);
	}
	addTask(taskname, params, target_worker) {
		let request = this.pool.createRequest();
		let payload = {
			type: 'addTask',
			request_id: request.id,
			body: {
				taskname,
				params
			}
		};
		//@NOTE: may be identity, not const?
		this.onaddTask('self', payload, target_worker);

		return request.promise;
	}
}

module.exports = HybridBroker;
