'use strict';

let zmq = require('zmq');
let _ = require('lodash');

class Broker {
  constructor(uri) {
    this.taskmap = {};
    this.cursors = {};
    this.broker = zmq.socket('router');
    // console.log('Broker on %s', uri);
    this.broker.on('message', (...args) => this.handleMessage(args));
    this.broker.bindSync(uri);
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
  onstoplistenTask(identity, payload) {
    let task = payload.body;
    //@NOTE: unsub all when no task specified
    if (!task) {
      _.forEach(this.taskmap, (taskarray, task) => {
        _.pull(taskarray, identity)
      })
      return;
    }
    if (this.taskmap[task]) {
      _.pull(this.taskmap[task], identity);
      return;
    }
  }
  onlistenTask(identity, payload) {
    let task = payload.body;

    if (this.taskmap[task]) {
      !~this.taskmap[task].indexOf(identity) && this.taskmap[task].push(identity);
      return;
    }

    this.taskmap[task] = [identity];
    this.cursors[task] = 0;
  }
  onaddTask(identity, payload, target_worker) {
    let body = payload.body;
    let taskname = body.taskname;
    let free_worker = target_worker || this.getWorkerForTask(taskname)

    this.sendTask(free_worker, identity, payload);
  }
  getWorkerForTask(taskname) {
    let cursor = this.cursors[taskname] = (this.cursors[taskname] + 1) % this.taskmap[taskname].length;

    return this.taskmap[taskname][cursor];
  }
  sendTask(free_worker, identity, body) {
    body._sender = identity;
    this.broker.send([free_worker, '', JSON.stringify(body)]);
  }
}

module.exports = Broker;