/**
 * A Task source.
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

function TaskSource(options) {
  TaskSource.super_.call(this, options);
}

util.inherits(TaskSource, baseMod.Base);

TaskSource.prototype.start = function() {
  var self = this;
  this.startFunction(function(state) {
    self.state = state;
    self.emit('started');
    self.debugMsg('Started');
  });
};

TaskSource.prototype.next = function(callback) {
  var self = this;
  this.state = this.nextFunction(this.state, callback);
};

TaskSource.prototype.end = function() {
  var self = this;
  this.endFunction(this.state, function() {
    self.emit('ended');
    self.debugMsg('Ended');
  });
};

exports.TaskSource = TaskSource;