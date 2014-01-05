/**
 * Main code.
 * 
 * Copyright 2012 Marcelo Gornstein &lt;marcelog@@gmail.com&gt;
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

function MinionPool(options) {
  for(k in options) {
    this[k] = options[k];
  }
}
util.inherits(MinionPool, events.EventEmitter);

// Internal
MinionPool.prototype.next = function(callback) {
  var self = this;
  this.taskSourceState = self.taskSource(self.taskSourceState, function(task) {
    if(task === undefined) {
      if(self.debug) {
        self.debugMsg('MinionPool %s: No more tasks', self.name);
      }
      self.emit('noMoreTasks');
      self.noMoreTasks = true;
      self.taskSourceTerminate(self.taskSourceState);
    }
    callback(task);
  });
};

MinionPool.prototype.initMinions = function() {
  var self = this;
  this.minions = [];
  for(var i = 0; i < this.concurrency; i++) {
    if(this.debug) {
      this.debugMsg('MinionPool %s: Starting minion #%d', this.name, i);
    }
    this.minions.push(
      new Minion({
        id: i,
        debug: this.debug,
        state: this.minionInit(i),
        handler: function(minionId, task, result) {
          if(self.debug) {
            self.debugMsg(
              'MinionPool %s: #%d: Task (%s) finished with: %s',
              self.name, minionId, JSON.stringify(task), JSON.stringify(result)
            );
          }
          self.emit('taskEnded', {
            task: task,
            minionId: minionId,
            result: result
          });
        }
      })
    );
  } 
};

MinionPool.prototype.start = function() {
  var self = this;
  if(this.debug) {
    this.debugMsg('MinionPool %s: Starting work', this.name);
  }
  this.initMinions();
  this.taskSourceState = this.taskSourceInit();
  this.currentTasks = 0;
  this.on('taskEnded', function(result) {
    var minionId = result.minionId;
    self.assignTask(minionId);
  });
  for(var i = 0; i < self.concurrency; i++) {
    self.assignTask(i);
  }
};

MinionPool.prototype.assignTask = function(minionId) {
  var self = this;
  var minion = self.minions[minionId];
  if(self.debug) {
    self.debugMsg('MinionPool %s: Fetching next task for: #%d', self.name, minionId);
  }
  this.next(function(task) {
    if(task !== undefined) {
      if(self.debug) {
        self.debugMsg(
          'MinionPool %s: Minion #%d: Assigning task: %s',
          self.name, minionId, JSON.stringify(task)
        );
      }
      minion.workOn(task, self.taskEnded);
    }
  });
};

MinionPool.prototype.debugMsg = function() {
  if(this.debug) {
    console.log.apply(undefined, Array.prototype.slice.call(arguments));
  }
};

function Minion(options) {
  for(k in options) {
    this[k] = options[k];
  }
}

Minion.prototype.workOn = function(task, callback) {
  var self = this;
  this.handler(this.id, task, this.state, function(result) {
    self.state = result.state;
    callback(self.id, task, result.result);
  });
};

exports.MinionPool = MinionPool;