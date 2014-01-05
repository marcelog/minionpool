var minionsMod = require('../src/minions');
var mysql = require('mysql');
var util = require('util');

var options = {
  name: 'test',
  debug: true,
  concurrency: 50,
  taskSourceInit: function() {
    var pool = mysql.createPool({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: 'pass'
    });
    return {pool: pool, item: 0};
  },
  taskSourceTerminate: function(state) {
    state.pool.end();
  },
  taskSource: function(state, callback) {
    var db = 'db';
    var table = 'table';
    var sql = 'SELECT * FROM `' + db + '`.`' + table + '` ORDER BY `id` ASC LIMIT ?,1';
    state.pool.query(sql, [state.item], function(err, rows) {
      if(err) throw(util.inspect(err));
      var task = undefined;
      if(rows.length === 1) {
        task = rows[0];
      }
      callback(task);
    });
    state.item++;
    return state;
  },
  minionInit: function(id) {
    return {};
  },
  taskHandler: function(minionId, task, state, callback) {
    callback(minionId, task, {});
  }
};

try {
  var minionPool = new minionsMod.MinionPool(options);
  minionPool.start();
} catch(error) {
  console.log(util.inspect(error));
}