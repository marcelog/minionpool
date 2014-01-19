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
  var self = this;
  if(options.continueOnError === undefined) {
    options.continueOnError = true;
  }
  if(options.minionStart === undefined) {
    options.minionStart = this.dummyMinionStart;
  }
  if(options.minionEnd === undefined) {
    options.minionEnd = this.dummyMinionEnd;
  }
  if(options.poolEnd === undefined) {
    options.poolEnd = this.dummyPoolEnd;
  }
  if(options.taskSourceStart === undefined) {
    options.taskSourceStart = this.dummyTaskSourceStart;
  }
  if(options.taskSourceEnd === undefined) {
    options.taskSourceEnd = this.dummyTaskSourceEnd;
  }
  options.name = options.name + ' Pool';
  MinionPool.super_.call(this, options);
  this.minions = [];
  this.minionsStarted = 0;
  this.minionsFinished = 0;
  this.minionsIdle = 0;
  this.minionsWithError = 0;
  this.noMoreTasks = false;
  this.setupEvents();
  this.shutdown = false;
  this.endFunction = function() {
    self.shutdown = true;
    for(var i = 0; i < this.minions.length; i++) {
      self.minions[i].end();
    }
    self.poolEnd();
  };
  this.startFunction = function() {
    self.taskSource = new taskSourceMod.TaskSource({
      name: self.name + '- task source',
      debug: self.debug,
      logger: self.logger,
      startFunction: self.taskSourceStart,
      endFunction: self.taskSourceEnd,
      nextFunction: self.taskSourceNext
    });
    self.taskSource.on('started', function() {
      self.emit('taskSourceStarted');
    });
    self.taskSource.on('error', function(err) {
      self.emit('taskSourceStartError', err);
    });
    self.taskSource.on('ended', function() {
      self.emit('taskSourceEnded');
    });
    for(var id = 0; id < self.concurrency; id++) {
      self.startMinion(id);
    }
  }
}
util.inherits(MinionPool, baseMod.Base);

MinionPool.prototype.injectTask = function(task) {
  var self = this;
  if(this.shutdown) {
    return;
  }
  var minionId = this.findAvailableMinion();
  if(minionId === -1) {
    // Try to reschedule.
    if(this.debug) {
      this.debugMsg('No available workers, rescheduling task');
    }
    setTimeout(function() {
      self.injectTask(task);
    }, 100);
  } else {
    if(this.debug) {
      this.debugMsg('Assigning injected task to: ', minionId);
    }
    this.minions[minionId].workOn(task);
  }
};

MinionPool.prototype.findAvailableMinion = function() {
  for(var i = 0; i < this.minions.length; i++) {
    if(!this.minions[i].isBusy()) {
      return i;
    }
  }
  return -1;
};

MinionPool.prototype.setupEvents = function() {
  var self = this;
  this.on('allMinionsStarted', function() {
    if(self.minionsWithError > 0) {
      self.end();
    } else {
      self.debugMsg('All workers started');
      self.taskSource.start();
    }
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
  this.on('minionStartError', function(id, task) {
    self.minionsFinished++;
    self.minionsWithError++;
    if(self.minionsFinished === self.concurrency) {
      self.emit('allMinionsFinished');
    }
  });
  this.on('minionEnded', function(id) {
    self.minionsFinished++;
    if(self.minionsFinished === self.concurrency) {
      self.emit('allMinionsFinished');
    }
  });
  this.on('minionIdle', function(id) {
    if(self.debug) {
      self.debugMsg('Minion ', id, ' is idle');
    }
    self.minions[id].end();
    self.minionsIdle++;
  });
  this.on('minionTaskFinished', function(id, err, task) {
    if(err && self.debug) {
      self.debugMsg('Task finished with error: ', util.inspect(err));
    }
    if(err && !self.continueOnError) {
      self.taskSource.end();
    } else {
      self.assignTask(id);
    }
  });
  this.on('taskSourceStarted', function() {
    if(this.taskSourceNext !== undefined) {
      for(var i = 0; i < self.concurrency; i++) {
        self.assignTask(i);
      }
    }
  });
  this.on('taskSourceStartError', function(err) {
    if(self.debug) {
      self.debugMsg('Task source start error: ', util.inspect(err));
    }
    self.end();
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
    logger: this.logger,
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
  newMinion.on('error', function() {
    self.emit('minionStartError', id);
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
  this.next(function(err, task) {
    if(err) {
      if(self.debug) {
        self.debugMsg('Task next error: ', util.inspect(err));
      }      
    }
    if(task !== undefined) {
      if(self.debug) {
        self.debugMsg('Assigning task: to ', minionId, JSON.stringify(task));
      }
      minion.once('taskFinished', function(err, task) {
        self.emit('minionTaskFinished', minionId, err, task);
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
    callback(undefined, undefined);
  } else {
    this.taskSource.next(function(err, task) {
      if(task === undefined) {
        self.noMoreTasks = true;
      }
      callback(err, task);
    });
  }
};

MinionPool.prototype.dummyMinionStart = function(callback) {
  callback(undefined, {});
};

MinionPool.prototype.dummyMinionEnd = function(state, callback) {
  callback();
};

MinionPool.prototype.dummyTaskSourceStart = function(callback) {
  callback(undefined, {});
};

MinionPool.prototype.dummyTaskSourceEnd = function(state, callback) {
  callback();
};

MinionPool.prototype.dummyPoolEnd = function() {};

exports.MinionPool = MinionPool;
exports.ArrayMinionPool = require('./array_minionpool').ArrayMinionPool;
