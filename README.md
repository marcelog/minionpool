# About
**minions** allows you to concurrently process any tasks you need to (similar to
a worker pool). And it's very simple to use.

## Installing it
The npm package is called **minionpool**.

# How it works
First things first. To make use of this, you just have to provide a few callbacks,
then instantiate a MinionPool and start() it. A *MinionPool* has
*Minions*, that process *tasks*. Tasks are provided by a *task source*, which
is called to get one task at a time, one for each minion started, and one for
each minion that finishes a previous task.

Both the minions and the task source can keep a *state*, which is useful to keep
database connections for example. 

# Quick Example

## Main code
```js
var minionsMod = require('./src/minions');

try {
  var minionPool = new minionsMod.MinionPool(options);
  minionPool.start();
} catch(error) {
  console.log(util.inspect(error));
}
```

## Configuring the pool
Let's see now what can be defined inside the **options** that we're passing to
the **MinionPool** constructor:

```js
var options = {
  // A name for your minions pool, useful for debugging.
  name: 'MyPool',

  // When 'true', some messages are written to console.
  debug: false,

  // How many minions to run concurrently.
  concurrency: 10,

  // Called to initialize a 'task source'. It should return an initial 'state'
  // (like db connections, file descriptors, etc). See below.
  taskSourceInit: function() {
    return {};
  },

  // The task source produce 'tasks', that are assigned to minions. A task
  // source receives its previous state, and should return a new (or the same)
  //state. Also, it should call the callback with the new task (or
  // 'undefined' when none is found).
  taskSource: function(state, callback) {
    var task = ...;
    callback(task);
    return newState;
  },

  // Called to do any cleanup for the task generator once it runs out of tasks.
  taskSourceTerminate: function(state) {
    
  },

  // Called to initialize each one of the minions. Returns the initial state for
  // each one of them.
  minionInit: function(id) {
    return {};
  },

  // The actual code that works on a task. Should call the 'callback' when
  // done, passing the minionId, the task received, and the result for that task.
  taskHandler: function(minionId, task, state, callback) {
    callback(minionId, task, {});
  }
};
```

# MySQL Example
See [this](https://github.com/marcelog/minions/tree/master/examples/mysql.js).
