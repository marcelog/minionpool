/**
 * This example shows how to use an ArrayMinionPool.
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
var minionsMod = require('../src/array_minionpool');
var util = require('util');

var options = {
  name: 'test',
  debug: true,
  concurrency: 5,
  logger: console.log,
  minionTaskHandler: function(task, state, callback) {
    // Simulate some work after a giving time.
    setTimeout(function() { callback(state); }, Math.floor(Math.random() * 500));
  },
  poolEnd: function() {
    state.pool.end(function() {
      process.exit(0);
    });
  }
};

var data = [];
for(var i = 0; i < 50; i++) {
  data.push(i);
}
var minionPool = new minionsMod.ArrayMinionPool(options, data);
minionPool.start();
