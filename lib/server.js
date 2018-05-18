const server = require('./http-server'),
    config = require('./config').config,
    utils = require('./utils'),
    api = require('./api'),
    fancy_server = require('./fancy-server'),
    ms_server = require('./ms-server')
    ;
    // assets = require('./assets');

/**
 * http服务器前置处理
 * @param req
 * @param res
 */
function httpPre(req, res) {
    let path = req.url, method = req.method, ip = utils.getClientIp(req);
    utils.logger('HTTP：%s,%s,%s',ip,method,path);
    // 转发交易数据图请求
    if(fancy_server.handler(req,res)){
        return;
    }
    if(ms_server.handler(req,res)){
	return;
    }
    // 只能使用特定域名访问
   /* if(utils.forbidenIpVisit(req,res)){
        return;
    }*/
    // 跨域处理返回204
    if(utils.crosHandler(req,res)){
        return;
    }
    // 如果是认证信息，检查认证是否正确
    if(!utils.http_base_auth(req,res)){// 认证失败直接返回
        return;
    }
    // HTTP协议 测试与正式环境只开放预审请求到后台 开发环境需要允许所有的api请求
   /* if(path.startsWith(config.http_allow_path)){
        // http api处理
        req.headers['X-Forwarded-For'] = ip;
        api.handler(req,res);
        return;
    }*/

    res.emit('next');
}

/**
 * 创建静态服务器，用于处理html、静态文件以及Certbot证书注册请求
 * 默认的静态文件、页面等目录在./public目录下
 */
function createStaticSever() {
    let http_server = server.createServer({
        // root: config.http_root,//默认取./public目录
        cors: true,
        corsHeaders: config.cors_headers,
        corsMethods: config.cors_methods,
        before: [httpPre]
    });
    //因为当前阿里云服务器使用的专有网络
    //公网IP的配置是在系统之外的，所以不能在程序中不能直接监听对应的公网IP
    http_server.listen(config.http_port/*,config.host*/);
}

/**
 * https前置处理
 * @param req
 * @param res
 */
function httpsPre(req, res) {
    let path = req.url, method = req.method, ip = utils.getClientIp(req);
    utils.logger('HTTPS：%s,%s,%s',ip,method,path);
    // 只能使用特定域名访问
   /* if(utils.forbidenIpVisit(req,res)){
        return;
    }*/
    // 禁止直接请求文件目录 需要认证
    // 如果是认证信息，检查认证是否正确
    /*if(!utils.http_base_auth(req,res)){
        return;
    }*/
    // 跨域处理返回204
    if(utils.crosHandler(req,res)){
        return;
    }
    if(path.startsWith(config.api_path)){// api请求处理
        req.headers['X-Forwarded-For'] = ip;
        api.handler(req,res);
        return;
    }
    res.emit('next');
}

/**
 * 创建api服务器
 */
function createApiSever() {
    let https_server = server.createServer({
        https: {
            cert: config.ssl_crt_path,
            key: config.ssl_key_path
        },
        // root: config.root,// 静态文件webroot
        cors: true,
        corsHeaders: config.cors_headers,
        corsMethods: config.cors_methods,
        /*重写http-sever.js的反向代理
        proxy: function (req, res) {
            console.log(req);
            proxy.web(req, res, {
                target: 'http://10.34.2.9:8094',
                changeOrigin: true
            });
        },*/
        // proxy: config.proxy,
        before: [httpsPre]
    });
    //因为当前阿里云服务器使用的专有网络
    //公网IP的配置是在系统之外的，所以不能在程序中不能直接监听对应的公网IP
    https_server.listen(config.https_port/*,config.host*/);
}

module.exports = {
    createStaticSever: createStaticSever,
    createApiSever: createApiSever
};
