/**
 * Created by chenpeng on 14-3-25.
 */

var log = require('pomelo-logger').getLogger('web-log', __filename, process.pid);
process.env.LOGGER_LINE = true;

var qrcode = require('./lib/util/qrcode');
var db = require('./lib/util/db');
var socket = require('./lib/util/socket');
var utils = require('./lib/util/utils');

var routes = module.exports = function (app) {
    this.app = app;
    app.get('/', routes.index );
    app.get('/QRCode', routes.qrCode);
    app.get("/qrOpen:door", routes.qrOpen);   //二维码开门URL

    app.get('/authCallback', routes.authCallback);

    app.post("/Open", routes.doOpen);       //password open

    app.get("/openLog", routes.openLog);
    //test
    app.get('/view',routes.view);       //用于查看当前在线的门
    app.get('/test', routes.test);      //测试接口，开门操作(打开所有当前在线的门)
    return app.router;
};
routes.openLog = function ( req, res){
    db.getLogs( function ( err, list)
    {
        console.log(list);
        res.render("openLog",{
            title:"开门记录",
            list:list
        });
    });
}

/**发送客服消息
function sendMessage( msg,user_id, fn)
{
    utils.post("http://v.ubox.cn//wx_open/interface_msg_2_user",{
        app_name:"zmkm",
        user_id:user_id,
        msg:msg
    }, function (data)
    {
        if ( "string" == typeof data)
        {
            log.info(data);
            data = eval("(" + data + ")");
        }
        fn( data);
    });
}
**/


routes.index = function(req, res){
    res.render('index');
};


routes.qrCode = function ( req, res)
{
    var door_id = req.query.door_id;
    console.log( req.session.cookie);

    var url = "http://" + this.app.get('host_') +":"+ this.app.get('port') + '/qrOpen'; // 二维码开门URL
    url = url + door_id;
    var qr = qrcode.qrcode(4, 'M');
    qr.addData(url);  // 解决中文乱码
    qr.make();
    var src = qr.createImgTag(5, 10);  // 获取base64编码图片字符串
    src = src.match(/src="([^"]*)"/)[1];  // 获取图片src数据
    res.render("QrCode",{
        url:src,
        title:"指码开门",
        door_id:door_id
    })
};



routes.qrOpen = function ( req, res) {

    var door_id = req.params['door'];
    if( !door_id)
    {
        door_id = req.session.door_id;
    }

    console.log("cookies", req.cookies);

    if( door_id)
    {
        var user_id = req.cookies.user_id;
        if( user_id )
        {
            if(req.session.door_id){
                delete req.session.door_id;
            }
            db.checkUser( user_id, door_id, function ( err, user)
            {
                if( user && user.user_id == user_id)
                {
                    //ok
                    db.getDoorUUID( door_id, function ( err, door)
                    {
                        if( err)
                        {
                            db.Log(req.cookies.user_id, door_id, false, err.message);
                            log.error(err.stack);
                            res.render("error",{
                                header:"访问错误！",
                                info:"请重新扫码开门！"
                            });
                        }
                        else
                        {
                            if( door && door.door_uuid)
                            {
                                var uuid = door.door_uuid.replace(new RegExp(',','g'),''); //清除','

                                socket.send(uuid,'k',function(error)
                                {
                                    if(error)
                                    {
                                        db.Log(req.cookies.user_id, door_id, false, error.message);
                                        log.error(error.message);
                                        res.render("error",{
                                            header:"失败",
                                            info:error.message
                                        });
                                    }
                                    else
                                    {
                                        db.Log(req.cookies.user_id, door_id, false);
                                        log.info( "door", door_id, door.door_name, " open !");
                                        res.render("error",{
                                            header:"成功",
                                            info:"门已经打开，请进！"
                                        });
                                    }

                                }); //开门

                            }
                            else
                            {
                                db.Log(req.cookies.user_id, door_id, false, "not find the door " + door_id);
                                console.log("door", door);
                                res.render("error",{
                                    header:"无法连接到门",
                                    info:"请重新扫码开门！"
                                });
                            }
                        }
                    });
                }
                else
                {
                    req.session.door = door_id;
                    //not find user, need a PassWord
                    res.render("doOpen");
                }
            });
        }
        else
        {
            if( !req.session.door_id){
                req.session.door_id = door_id;

                //跳转到授权页面
                var URL = "http://" + this.app.get('host_') +":"+ this.app.get('port') + '/authCallback';
                res.render("jump",{url:"http://v.ubox.cn//wx_open/page/zmkm?address=" + URL});
            }
            else
            {
                //进入第二次授权 。 ERROR
                res.render("error",{
                    header:"500",
                    info:"授权错误"
                });
            }

        }
    }
    else
    {
        res.render("error",{
            header:"403",
            info:"无效链接"
        });
    }
};

routes.authCallback = function ( req, res)
{
    var authCode = req.query.ubox_auth_code;

    utils.get("http://v.ubox.cn/wx_open/interface_load_user_by_auth_code?app_name=zmkm&ubox_auth_code=" + authCode, function(data)
    {
        if ( typeof data == "string")
        {
            log.info(data);
            data = eval( "(" + data + ")");
        }
        if( data && data.data)
        {

            var user_id = data.data.user_id;
            log.info("set cookies user_id", user_id);
            res.cookie("user_id", user_id, {maxAge:186624000000});  //setCookie

        }
        res.render("jump", { url:"http://" + this.app.get('host_') +":"+ this.app.get('port') + '/qrOpen' + req.session.door_id});
    });

};


//url open need password
routes.doOpen = function( req, res)
{
    if(req.session.door && req.body)
    {
        var password = req.body.password;
        var door_id = req.session.door;
        log.info(password,door_id);
        db.checkPassWord(password, function (err, pwd)
        {
            if( err)
            {
                db.Log(req.cookies.user_id, door_id, true, err.message);
                log.error(err.stack);
                res.render("error",{
                    header:"访问异常",
                    info:"请重新扫码开门！"
                });
            }
            else
            {
                if( pwd && pwd.password == password)
                {
                    //OPEN
                    db.getDoorUUID(door_id, function(err, door)
                    {
                        if( err)
                        {
                            db.Log(req.cookies.user_id, door_id, true, err.message);
                            log.error(err.stack);
                            res.render("error",{
                                header:"访问错误！",
                                info:"请重新扫码开门！"
                            });
                        }
                        else
                        {
                            if( door && door.door_uuid)
                            {
                                var uuid = door.door_uuid.replace(new RegExp(',','g'),''); //清除','

                                socket.send(uuid,'k',function(error)
                                {
                                    if(error)
                                    {
                                        db.Log(req.cookies.user_id, door_id, true, error.message);
                                        log.error(error.message);
                                        res.render("error",{
                                            header:"失败",
                                            info:error.message
                                        });
                                    }
                                    else
                                    {
                                        db.Log(req.cookies.user_id, door_id, true);
                                        log.info( "door", door_id, door.door_name, " open !");
                                        res.render("error",{
                                            header:"成功",
                                            info:"门已经打开，请进！"
                                        });
                                    }

                                }); //开门

                            }
                            else
                            {
                                db.Log(req.cookies.user_id, door_id, true, "not find the door " + door_id);
                                console.log("door", door);
                                res.render("error",{
                                    header:"无法连接到门",
                                    info:"请重新扫码开门！"
                                });
                            }
                        }
                    });
                }
                else
                {
                    db.Log(req.cookies.user_id, door_id, true, "password error");
                    console.log("pwd",pwd);
                    res.render("error",{
                        header:"密码错误",
                        info:"请重新扫码开门！"
                    });
                }
            }
        });
    }
    else
    {
        log.error("no door, no password!");
        res.render("error",{
            header:"访问链接失效",
            info:"请重新扫码开门！"
        });
    }
    delete req.session.door;
};



routes.view = function (req, res){
    log.info(req.path);
    res.render('view',{list:socket.getClientList()});
};

routes.test = function (req, res){
    socket.sendAll("k");
    res.send(200);
//    log.info('just test', req.path,req.params['id']);
//    if(req.params['id'])
//    {
//        socket.send(req.params['id'],'k',function(error)
//        {
//            if(error)
//            {
//                res.send(JSON.stringify(error));
//            }
//            else
//            {
//                res.send(200);
//            }
//
//        });
//    }else
//    {
//        res.send("没有发现ID");
//    }
};


/***********扫码回调
 routes.qrcallback = function ( req, res){
 //
 log.info(JSON.stringify( req.body));

 var user_id = req.body.user_id;             //APP_ID
 var code = req.body.qr_key;                 //二维码对应的token
 var is_subscribe = req.body.is_subscribe;   //是否第一次关注

 token.check( code, function ( err, data)
 {
 log.info(JSON.stringify(data));
 if( data && data.token == code)
 {
 var door_id = data.door;
 log.info("ok ! to check user","door", data.door);

 //欢迎使用指码开门，如果开门失败，请尝试如下url开门：http://11.22.33.44/index?token=123abc
 res.send(rePostMsg( 200, "欢迎使用指码开门，正在为您开门！"));

 token.checkUser(user_id,door_id, function ( err, user)
 {
 if ( user && user.user_id == user_id)
 {
 //to Open
 token.getDoorUUIDByDoorId(door_id, function(err, door)
 {
 if( err)
 {
 log.error(err.stack);
 token.addOpenLog(user_id,door_id, false, false, err.message);
 res.send( rePostMsg( 200, "开门失败，" + err.message));
 }
 else
 {
 if( door && door.door_uuid)
 {
 var uuid = door.door_uuid.replace(new RegExp(',','g'),'');
 socket.send(uuid,'k',function(error)
 {
 if(error)
 {
 log.error(error.message);
 token.addOpenLog(user_id,door_id, false, false, error.message);
 sendMessage("开门失败，" + error.message,user_id, function ( data)
 {

 });
 }
 else
 {
 token.addOpenLog(user_id,door_id, false, true, "open!");
 log.info( "door", door_id, door.door_name, " open !");
 sendMessage("开门成功，请进",user_id, function ( data)
 {

 });
 }

 });
 }
 else
 {
 console.log("door", door);
 token.addOpenLog(user_id,door_id, false, false, "没找到门");
 res.send(rePostMsg( 200, "开门失败，没找到门"));
 }
 }
 });
 }
 else
 {
 //url To Open
 var urlToken = token.addOpenLog( user_id, door_id, true);
 sendMessage("您的微信帐号没有授权，请点击<a href='http://124.127.89.52:4000/open" + urlToken +"'>开门</a>。",user_id, function ( data)
 {

 });
 }
 });
 }
 else
 {
 console.log("error",err,data);
 res.send(rePostMsg(200, "开门失败门" + err ? (", " + err.message) : ""));
 }
 });

 };
 ******/
