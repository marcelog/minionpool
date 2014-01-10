/**
 * Main code.
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
var minionMod = require('./minion');
var baseMod = require('./base');
var taskSourceMod = require('./task_source');

function MinionPool(options) {
  options.name = options.name + ' Pool';
  MinionPool.super_.call(this, options);
  this.minions = [];
  this.minionsStarted = 0;
  this.minionsFinished = 0;
  this.minionsIdle = 0;
  this.noMoreTasks = false;
  this.setupEvents();
}
util.inherits(MinionPool, baseMod.Base);

MinionPool.prototype.start = function() {
  var self = this;
  this.taskSource = new taskSourceMod.TaskSource({
    name: this.name + '- task source',
    debug: this.debug,
    startFunction: this.taskSourceStart,
    endFunction: this.taskSourceEnd,
    nextFunction: this.taskSourceNext
  });
  this.taskSource.on('started', function() {
    self.emit('taskSourceStarted');
  });
  for(var id = 0; id < this.concurrency; id++) {
    this.startMinion(id);
  }
};

MinionPool.prototype.end = function() {
};

MinionPool.prototype.setupEvents = function() {
  var self = this;
  this.on('allMinionsStarted', function() {
    self.debugMsg('All workers started');
    self.taskSource.start();
  });
  this.on('allMinionsFinished', function() {
    self.debugMsg('All workers ended');
    self.taskSource.end();
  });
  this.on('minionStarted', function(id) {
    self.minionsStarted++;
    if(self.minionsStarted === self.concurrency) {
      self.emit('allMinionsStarted');
    }
  });
  this.on('minionEnded', function(id) {
    self.minionsFinished++;
    if(self.minionsFinished === self.concurrency) {
      self.emit('allMinionsFinished');
    }
  });
  this.on('minionIdle', function(id) {
    self.debugMsg('Minion ', id, ' is idle');
    self.minions[id].end();
    self.minionsIdle++;
  });
  this.on('minionTaskFinished', function(id, task, result) {
    self.assignTask(id);
  });
  this.on('taskSourceStarted', function() {
    for(var i = 0; i < self.concurrency; i++) {
      self.assignTask(i);
    }
  });
  this.on('taskSourceEnded', function() {
    self.end();
  });
};

MinionPool.prototype.startMinion = function(id) {
  var self = this;
  var newMinion = new minionMod.Minion({
    name: this.name + '- worker #' + id,
    id: id,
    debug: this.debug,
    startFunction: this.minionStart,
    endFunction: this.minionEnd,
    handlerFunction: this.minionTaskHandler
  });
  newMinion.on('started', function() {
    self.emit('minionStarted', id);
  });
  newMinion.on('ended', function() {
    self.emit('minionEnded', id);
  });
  this.minions.push(newMinion);
  newMinion.start();
};

MinionPool.prototype.assignTask = function(minionId) {
  var self = this;
  var minion = self.minions[minionId];
  if(self.debug) {
    self.debugMsg('Fetching next task for: #', minionId);
  }
  this.next(function(task) {
    if(task !== undefined) {
      if(self.debug) {
        self.debugMsg(
          'Assigning task: ', minionId, JSON.stringify(task)
        );
      }
      minion.once('taskFinished', function(result) {
        self.emit('minionTaskFinished', minionId, task, result);
      });
      minion.workOn(task, self.taskEnded);
    } else {
      self.emit('minionIdle', minionId);
    }
  });
};

MinionPool.prototype.next = function(callback) {
  var self = this;
  if(self.noMoreTasks) {
    callback(undefined);
  } else {
    this.taskSource.next(function(task) {
      if(task === undefined) {
        self.noMoreTasks = true;
      }
      callback(task);
    });
  }
};

exports.MinionPool = MinionPool;
