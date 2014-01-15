/**
 * A simple minion pool that accepts an array as the source of
 * data.
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
var minionMod = require('./minionpool');
var util = require('util');

function ArrayMinionPool(options, data) {
  options.taskSourceStart = function(c) {
    c({data: data});
  };
  options.taskSourceNext = function(state, c) {
    var item = state.data.pop();
    c(item);
    return state;
  };
  ArrayMinionPool.super_.call(this, options);

}
util.inherits(ArrayMinionPool, minionMod.MinionPool);

exports.ArrayMinionPool = ArrayMinionPool;
