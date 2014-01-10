/**
 * Main ancestor for most of the classes.
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
var util = require('util');
var events = require('events');

/**
 * Options is whatever you want, including:
 * {
 *   name: <string>
 *   debug: <bool>
 *   logger: function(...) console.log compatible (N number of arguments)
 *   startFunction: function(callback) The callback should be called once the
 *                  start phase has been completed. The callback takes 0 args.
 *   endFunction: function(callback) Should be called once the end phase is
 *                completed. The callback does not take any arguments.
 * }
 */
function Base(options) {
  Base.super_.call(this);
  for(k in options) {
    this[k] = options[k];
  }
  if(this.debug === undefined) {
    this.debug = false;
  }
  if(this.logger === undefined) {
    this.logger = console.log;
  }
  this.debugMsg = function() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift(":");
    args.unshift(this.name);
    if(this.debug) {
      this.logger.apply(this, args);
    }
  };
  this.debugMsg('Created');
}
util.inherits(Base, events.EventEmitter);

Base.prototype.start = function() {
  var self = this;
  this.startFunction(function(state) {
    self.state = state;
    self.emit('started');
    self.debugMsg('Started');
  });
};

Base.prototype.end = function() {
  var self = this;
  this.endFunction(this.state, function() {
    self.emit('ended');
    self.debugMsg('Ended');
  });
};
exports.Base = Base;
