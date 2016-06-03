'use strict'

let _ = require('lodash');
let zmq = require('zmq');
let RequestPool = require('async-requests').RequestPool;

class Worker {
  constructor(uri, name) {
    this.worker = zmq.socket('dealer');
    this.worker.identity = 'zmq-worker-' + (name || process.pid);

    this.worker.on('connect', () => {
      console.log('connected', process.pid);
      this.listenTask('heartbeat', () => {
        console.log('hb on', process.pid);
        return true;
      })
    });
    this.worker.monitor(500, 0);
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
    if (!cb) return this.makeErrorResponse(sender, request_id);
    let result = cb(params);
    Promise.resolve(result).then((d) => this.makeResponse(sender, request_id, d));
  }
  makeErrorResponse() {
    console.log('Everything bad');
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
  stoplistenTask(taskname) {
    this.send({
      type: 'stoplistenTask',
      body: taskname
    });
    taskname && _.unset(this.callbacks, taskname);
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