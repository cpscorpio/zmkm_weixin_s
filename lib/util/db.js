/**
 * Created by chenpeng on 14-5-12.
 */

var log = require('pomelo-logger').getLogger('web-log', __filename, process.pid);

var db = module.exports;

var SQLite = require('sqlite3').verbose();

var dateFile = __dirname + "/../database/data.sqlite";

var utils = require('../util/utils');

db.checkUser = function ( user_id, door_id, callback)
{
    console.log(dateFile);
    var db = new SQLite.Database(dateFile);

    db.serialize(function() {

        db.all("SELECT * FROM user where user_id='" + user_id + "' and door_id='" + door_id + "'", function(err, row)
        {
            console.log("db.checkUser " , err, row);
            var user = null;
            if(row && row.length > 0)
            {
                user = row[0];
            }
            db.close();
            callback( err, user);
        });
    });
}

db.checkPassWord = function ( passwd, callback)
{
    var db = new SQLite.Database(dateFile);
    db.serialize(function() {

        db.all("SELECT * FROM password where password='" + passwd + "'", function(err, row)
        {
            console.log("db.checkPassWord", err, row);
            var password = null;
            if(row && row.length > 0)
            {
                password = row[0];
            }
            db.close();
            callback( err, password);
        });
    });
}


db.Log = function( user_id, door_id, isUrl, desc)
{
    var db = new SQLite.Database(dateFile);
    var url = isUrl ? 1:0;
    var desc = desc ? desc : "";
    var now = Math.ceil(new Date().getTime()/1000);

    db.serialize(function() {
        var stmt = db.prepare("INSERT INTO open_log (user_id, door_id, ctime, url, desc) VALUES (?, ?, ?, ?, ?)");
        stmt.run(  user_id, door_id,now,url, desc);
        stmt.finalize(function()
        {
            db.close();
        });
    });
}
db.getLogs = function ( callback)
{
    var db = new SQLite.Database(dateFile);
    db.serialize(function() {

        db.all("SELECT * FROM open_log", function(err, row)
        {
            console.log("db.getDoorUUID", err, row);
            var doorList = [];
            for ( var i = 0; row && i < row.length ; i++)
            {
                doorList.push({
                    user_id:row[i].user_id,
                    door_id:row[i].door_id,
                    ctime:utils.DateMSFormat(row[i].ctime),
                    desc:row[i].desc,
                    url:row[i].url
                })
            }
            db.close();
            callback( err, doorList);
        });
    });
}
db.getDoorUUID = function ( door_id, callback)
{
    var db = new SQLite.Database(dateFile);
    db.serialize(function() {

        db.all("SELECT * FROM door where door_id=" + door_id, function(err, row)
        {
            console.log("db.getDoorUUID", err, row);
            var door = null;
            if(row && row.length > 0)
            {
                door = row[0];
            }
            db.close();
            callback( err, door);
        });
    });
};