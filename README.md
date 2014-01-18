# About
**minionpool** allows you to concurrently process any tasks you need to (similar to
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

## Polling for tasks vs Injecting tasks
You can either make the pool poll for tasks from the task source, or inject
tasks asynchronously "from the outside". You can also find an example
of polling from tasks in the mysql example, and one that injects tasks in the
rabbitmq example. See below. 

# Quick Example

## Main code
```js
var minionpoolMod = require('minionpool');

var minionPool = new minionpoolMod.MinionPool(options);
minionPool.start();
```

## Configuring the pool
Let's see now what can be defined inside the **options** that we're passing to
the **MinionPool** constructor:

```js
var options = {

  // A name for your minions pool, useful for debugging.
  name: 'test',

  // Optional. When 'true', some messages are written to console.
  debug: true,

  // How many minions to run concurrently.
  concurrency: 5,

  // Optional. Uses the given Function to log messages.
  logger: console.log,

  // Optional. Called to initialize a 'task source'. It should call the callback
  // with an initial 'state' (like db connections, file descriptors, etc).
  // See below. The state will be passed when calling the next property.
  taskSourceStart: function(callback) {
    callback(state);
  },

  // Polling for tasks: The task source produce 'tasks', that are assigned to
  // minions. A task source receives its state from 'taskSourceStart' first, and
  // then from whatever it returns on subsequen calls (see below). Also, it
  // should call the callback with the new task (or 'undefined' when none is found).
  //
  // If you are not going to poll for tasks, set this one to undefined, and call
  // MinionPool.injectTask() to inject the tasks into the pool, they will be 
  // assigned to free minions (or rescheduled if none is available at the time,
  // be careful not to produce too many tasks).
  taskSourceNext: function(state, callback) {
    var task = ...;
    callback(task);
    return state;
  },

  // Optional. Called to do any cleanup for the task generator once it runs out
  // of tasks. Receives the 'state', doesn't have to pass any arguments to the
  // callback.
  taskSourceEnd: function(state, callback) {
    callback();
  },

  // The actual code that works on a task. Should call the 'callback' when
  // done, passing the new state.
  minionTaskHandler: function(task, state, callback) {
    callback(state);
  },

  // Optional. Called to initialize each one of the minions. Returns the initial
  // state for each one of them.
  minionStart: function(callback) {
    callback(state);
  },

  // Optional. Called to cleanup any needed stuff for each minion.
  minionEnd: function(state, callback) {
    callback();
  },

  // Optional. Called when the pool has finished all the available work.
  poolEnd: function() {
    process.exit(0);
  }
};
```

## Example using MySQL (will process all rows in a given table).

You might want to check out [mysql_minionpool](https://github.com/marcelog/mysql_minionpool) if you need to work with mysql, since it's a
specialized **minionpool**. In any case, [see this](https://github.com/marcelog/minions/tree/master/examples/mysql.js) for an example using
plain vanilla **minionpool**.

## Example using RabbitMQ
See [this](https://github.com/marcelog/minions/tree/master/examples/rabbitmq.js).

## Example using the ArrayMinionPool
See [this](https://github.com/marcelog/minions/tree/master/examples/array.js).

## Into the details: Lifecycle (Polling)

 1. A pool starts.
 2. All minions in the pool are started. For each minion, *minionStart* is called.
 3. After all the minions are started, the task source is started, by calling
 *taskSourceStart*.
 4. After the task source starts one task per minion is requested by calling
 *taskSourceNext*.
 5. When a minion finishes processing a task (*minionTaskHandler*), a new one
 will be assigned to it.
 6. When a minion finishes a task, but the task source does not have a task for
 it, that minion will become idle, and shutdown, by calling *minionEnd*.
 7. When all the minions have shutdowned, the task source will shutdown too, by
 calling *taskSourceEnd*.
 8. When the task source shuts down, the pool will shut down, and *poolEnd* will
 be called.

## Into the details: Lifecycle (Injected tasks)

 1. A pool starts.
 2. All minions in the pool are started. For each minion, *minionStart* is called.
 3. After all the minions are started, the task source is started, by calling
 *taskSourceStart*.
 4. Someone calls *MinionPool.injectTask* from the outside, a free minion is
 picked up and the task is assigned to it. Otherwise, the task is rescheduled
 internally until a free minion is available.
 5. The pool only shuts down when MinionPool.end() is called. Then all minions
 are finished.
 6. When all the minions have shutdowned, the task source will shutdown too, by
 calling *taskSourceEnd*.
 7. When the task source shuts down, the pool will shut down, and *poolEnd* will
 be called.



