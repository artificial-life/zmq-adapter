'use strict'

let Broker = require('./broker.js');
let RequestPool = require('async-requests').RequestPool;

class HybridBroker extends Broker {
  constructor() {
    super();
    this.pool = new RequestPool('cycle', 100000);
  }
  onresponseTask(identity, payload) {
    payload._recipient != 'self' ? super.onresponseTask(identity, payload) : this.pool.handleRequest(payload);
  }
  addTask(taskname, params) {
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
    this.onaddTask('self', payload);

    return request.promise;
  }
}

module.exports = HybridBroker;