#微信扫码开门
---

此版本只能用微信扫码开门
使用nodejs + [express](http://expressjs.jser.us/) 编码实现

#安装与运行
---

###node 安装
推荐使用[Node Version Manager ](https://github.com/creationix/nvm/)

    # curl https://raw.githubusercontent.com/creationix/nvm/v0.7.0/install.sh | sh

下载、编译和安装 node v0.10.x 的最新版

    # nvm install 0.10
    # nvm use 0.10  //使用已安装的node版本
    # nvm alias default 0.10    //设置默认


###使用npm(node包管理工具)安装依赖:

    # npm install -d    //安装

###运行

    # node app.js       //运行

####推荐使用 **[forever]()** 运行

    # [sudo] npm install forever -g //安装forever

    # forever start app.js         //运行
    # forever start -l app.js         //后台运行

#配置
---

在 app.js 文件中进行相关配置

####配置日志输出(log4js)

    Logger.configure({
        appenders: [
            {
                type: 'console'     //控制台输出
            }
            ,
            {
                "type": "file",     //文件输出
                "filename": __dirname + "/logs/log.log",
                "maxLogSize": 1048576,
                "layout": {
                    "type": "basic"
                }
                ,"backups": 5,
                "category": "web-log"
            }
            ,
            {
                "type": "file",
                "filename": __dirname + "/logs/static-log.log",
                "maxLogSize": 1048576,
                "layout": {
                    "type": "basic"
                }
                ,"backups": 5,
                "category": "static-log"
            }
            ,
            {
                "type": "file",
                "filename": __dirname + "/logs/socket-log.log",
                "maxLogSize": 1048576,
                "layout": {
                    "type": "basic"
                }
                ,"backups": 5,
                "category": "socket-log"
            }
        ],
        replaceConsole: true    //替换js console输出(eg:console.log())
    });

####配置服务器IP，Port

    app.set('host_','124.127.89.52');
    app.set('port', process.env.PORT || 4000);

####路由设置

    app.use(app.router);
    var routes = require('./routes');   //使用路由文件 routes.js 配置录音
    app.use(routes(app));

    app.use(function(req, res, next)        //not found Page
    {
        log.error('no %s method on %s , return 404', req.method, req.url);
        res.render("error",{
            header:"404",
            info:"Can't " + req.method + " " + req.url
        });
    });

    app.use( function ( err, req, res, next)    //error handler
    {
        log.error(err.stack);
        utils.sendMail(err.message, err.stack);
        res.render("error",{
            header:"500",
            info:err.message
        });
    });

####SOCKET
与主控宝的socket连接

    var socket = require('./lib/util/socket');   // lib/util/socket.js
    socket(app);
    app.set('_socketServer',socket);

####启动服务

    http.createServer(app).listen(app.get('port'), function(){
        log.log('Express server listening on port ' + app.get('port'));
    });

#与主控的Socket连接
---

`lib/util/socket.js`

每个主控控制着一个门的开关，并连接到socket服务器，保持长连接

####API

    socketServer.sendAll ( message)  //向所有连接到服务器的客户端发送消息
    socketServer.send (clientName, message ,callback)   //指定客户端发送消息.主要用来发送开门指令。开门指令为'k',发送之后会回调发送结果
    socketServer.getClientList()    //获取所有连接到服务器的客户端 return a Array

#数据库
---

**[SQLite3](https://github.com/mapbox/node-sqlite3)**

*操作类:`/lib/util/db.js`

*数据库文件:  `/lib/database/data.sqlite`

