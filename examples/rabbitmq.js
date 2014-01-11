/**
 * This example shows how to use minions to process messages coming in from
 * rabbitmq.
 * 
 * Copyright 2014 Marcelo Gornstein &lt;marcelog@@gmail.com&gt;
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * copyright Marcelo Gornstein <marcelog@gmail.com>
 * author Marcelo Gornstein <marcelog@gmail.com>
 */
var minionsMod = require('../src/minionpool');
var amqpMod = require('amqp');
var util = require('util');
var log4js = require('log4js');
var logger = log4js.getLogger();

var minionPool = null;
function injectTask(data) {
  var queue = data.queue;
  var task = data.task;
  if(minionPool === null) {
    queue.shift(true);
  } else {
    minionPool.injectTask(data);
  }
}

var options = {
  name: 'test',
  debug: true,
  concurrency: 5,
  logger: function() { logger.debug.apply(logger, Array.prototype.slice.call(arguments))},

  taskSourceStart: function(callback) {
    state = {};
    state.tasks = [];
    var mqOptions = {
      host: '127.0.0.1',
      login: 'guest',
      password: 'guest',
      authMechanism: 'AMQPLAIN',
      vhost: '/',
      defaultExchangeName: '',
      reconnect: true,
      reconnectBackoffStrategy: 'linear',
      reconnectExponentialLimit: 120000,
      reconnectBackoffTime: 1000
    };
    state.connection = amqpMod.createConnection(mqOptions);
    state.connection.on('error', function(what) {
      logger.error('General Error: ' + util.inspect(what));
    });
    state.connection.on('ready', function() {
      var exchangeOptions = {
        type: 'direct',
        passive: false,
        durable: true,
        confirm: true,
        autoDelete: false,
        arguments: {}
      };
      state.connection.exchange('some_exchange', exchangeOptions, function (exchange) {
        logger.debug('Exchange is open');
        var queueOptions = {
          autoDelete: false,
          durable: true,
          exclusive: false,
          arguments: {}
        };
        state.connection.queue('my_queue', queueOptions, function(queue) {
          queue.bind(exchange, 'my_key');
          this.workerQueue = queue;
          logger.debug('Queue: binded to my_key');
          callback(state);
          queue.subscribe({ack: true, prefetchCount: 5}, function(msg) {
            injectTask({queue: queue, task: msg.data.toString('utf-8')});
          });
        });
      });
    });
  },
  taskSourceEnd: function(state, callback) {
    state.connection.end();
    callback();
  },

  // Tasks wont be get by polling, but by someone calling injectTask() on the pool
  taskSourceNext: undefined,

  minionTaskHandler: function(data, state, callback) {
    var queue = data.queue;
    var task = data.queue;
    logger.debug('got task: %s', task);
    queue.shift(false);
    callback(state);
  },
  minionStart: function(callback) {
    callback({});
  },
  minionEnd: function(state, callback) {
    callback();
  },
  poolEnd: function() {
    process.exit(0);
  }
};

minionPool = new minionsMod.MinionPool(options);
process.on('SIGINT', function() {
  minionPool.end();
});
minionPool.start();
