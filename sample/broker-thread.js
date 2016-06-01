'use strict'

var Broker = require('../build/hybrid-broker.js');
var EventRouter = require('../build/event-router.js');

var broker = new Broker('tcp://*:5671');

var pubListener = 'tcp://127.0.0.1:5555';
var subListener = 'tcp://127.0.0.1:5556';
var router = new EventRouter(pubListener, subListener);

var hwm = 1000;
var verbose = 0;


router.setsockopt('pub', 'ZMQ_XPUB_VERBOSE', verbose);
router.setsockopt('pub', 'ZMQ_SNDHWM', hwm);