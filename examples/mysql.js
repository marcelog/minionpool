/**
 * This example shows how to use minions to process all the rows in a
 * mysql table.
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
var minionsMod = require('../src/minionpool');
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