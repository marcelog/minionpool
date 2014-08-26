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

function Base(options) {
  Base.super_.call(this);
  this.endCalled = false;
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
  try {
    this.startFunction(function(err, state) {
      self.state = state;
      if(err) {
        self.emit('error', err);
        self.debugMsg('Error: ' + util.inspect(err));
      } else {
        self.emit('started');
        self.debugMsg('Started');
      }
    });
  } catch(exception) {
    self.emit('error', exception);
    if(self.debug) {
      self.debugMsg('Error: ' + util.inspect(exception));
    }
  }
};

Base.prototype.end = function() {
  var self = this;
  this.endFunction(this.state, function() {
    if(!self.endCalled) {
      self.endCalled = true;
      self.emit('ended');
      self.debugMsg('Ended');
    }
  });
};
exports.Base = Base;
