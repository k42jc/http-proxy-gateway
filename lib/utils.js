const config = require('./config').config;
/**
 * 记录日志
 * @param info
 */
logger = console.log;

/**
 * 兼容java hashCode的获取字符串hash值
 * @param str
 * @returns {number}
 */
/*function hashCode(str){
    let h = 0, off = 0, len = str.length;
    for(let i = 0; i < len; i++){
        h = 31 * h + str.charCodeAt(off++);
    }
    return h;
}*/
function hashCode(ip){
    /*let h = 0, off = 0, len = str.length;
    for(let i = 0; i < len; i++){
        h = 31 * h + str.charCodeAt(off++);
    }*/
    let hash = ip.replace(/\./g, '');
    if(isNaN(hash % 2)) {
        hash = 0;
    }

    return hash;
}

/**
 * 只允许使用特定域名访问
 * @param req
 * @param res
 * @returns {boolean} 是否禁止当前请求
 */
function forbidenIpVisit(req,res){
    if(!req.headers.host || !req.headers.host.startsWith(config.host)){
        res.writeHead(400);
        res.end();
        return true;
    }
    return false;

}

/**
 * 获取客户端请求IP
 * @param req
 * @returns {*|null} ip
 */
function getClientIp(req) {
    let ip = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        (req.connection.socket ? req.connection.socket.remoteAddress : null);
    if (ip.startsWith('::ffff:')){
        ip = ip.substr('::ffff:'.length)
    }
    return ip;
}


/**
 * 返回信息
 * @param res
 * @param code
 * @param msg
 */
function response(res,code,msg) {
    res.setHeader('Content-Type', 'application/json;charset=UTF-8');
    res.end(JSON.stringify({
        code: code,
        msg: msg
    }));
}

/**
 * 跨域响应 204无报文体响应
 * @param req
 * @param res
 * @returns {boolean} 是否跨域请求
 */
function crosHandler(req,res){
    if(req.method === 'OPTIONS'){
        console.log('跨域处理');
        res.writeHead(204);
        res.end();
        return true;
    }
    return false;
}

/**
 * HTTP 基本认证
 * @param res
 * @return boolean 是否认证成功
 */
function http_base_auth(req,res){
    if(config.auth_path.split(',').indexOf(req.url) >= 0){// 当前只限制静态文件结构目录
        let auth = req.headers.authorization;
        if(auth){
            let from = Buffer.from(auth.substr('Basic '.length), 'base64');
            if(from.toString() === config.http_base_auth_user_pwd){
                return true;
            }

        }
        res.writeHead(401);
        res.setHeader('WWW-Authenticate','Basic realm="Secure Area"');
        res.end();
        return false;
    }
    return true;

}


/**
 * http重定向
 * @param secure
 * @param redirectPath
 * @param req
 * @param res
 */
function redirect(req,res,redirectPath){
    if (req.headers.host) {
        let url = require('url').parse('http://'+ req.headers.host);
        res.statusCode = 301;
        res.setHeader(
            'Location',
            // 'http'+ (secure ? 's' : '') +'://'+ url.hostname +':'+ port + req.url
            'http'+'://'+ url.hostname +':'+ config.http_port + redirectPath
        );
    }
    /*if (secure) res.setHeader(
        'Strict-Transport-Security',
        'max-age=8640000; includeSubDomains'
    );*/
    // res.emit('next');
}

module.exports = {
    logger: logger,
    response: response,
    hashCode: hashCode,
    getClientIp: getClientIp,
    http_base_auth: http_base_auth,
    crosHandler: crosHandler,
    forbidenIpVisit: forbidenIpVisit
}


