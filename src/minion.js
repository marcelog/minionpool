/**
 * Minions code.
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
var events = require('events');
var util = require('util');
var baseMod = require('./base');

function Minion(options) {
  Minion.super_.call(this, options);
}

util.inherits(Minion, baseMod.Base);

Minion.prototype.start = function() {
  var self = this;
  this.startFunction(function(state) {
    self.state = state;
    self.emit('started');
    self.debugMsg('Started');
  });
};

Minion.prototype.end = function() {
  var self = this;
  this.endFunction(this.state, function() {
    self.emit('ended');
    self.debugMsg('Ended');
  });
};

Minion.prototype.workOn = function(task) {
  var self = this;
  this.handlerFunction(task, this.state, function(result, state) {
    self.state = state;
    self.emit('taskFinished', task, result)
  });
};

exports.Minion = Minion;