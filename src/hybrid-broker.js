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
      this.heartbeat()
    }, HEARTBEAT_INTERVAL);
  }
  heartbeat() {
    _.forEach(this.worker_status, (status, worker_id) => {
      this.addTask('heartbeat', '', worker_id).then(() => {
        console.log("yeah, it's alive", worker_id);
      }).catch((e) => {
        console.log(e);
        console.log("nope, it's not", worker_id);
      })
    });
  }
  onlistenTask(identity, payload) {
    this.worker_status[identity] = true;
    super.onlistenTask(identity, payload);
  }
  onstoplistenTask(payload) {
    //@NOTE: removing worker from list
    !payload.body && _.unset(this.worker_status, identity);
    super.onstoplistenTask(payload);
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