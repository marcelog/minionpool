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
