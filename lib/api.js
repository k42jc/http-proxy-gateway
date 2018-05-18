// 处理api请求
const config = require('./config').config,
    zk = require('node-zookeeper-client'),
    utils = require('./utils'),
    url = require('url'),
    httpProxy = require('http-proxy'),
    /**
     * 缓存格式
         * {
        "Pub":{
            "1.0":["127.0.0.1","127.0.0.2"],
            "2.0":["127.0.0.1","127.0.0.2"]
        },
        "User":{
            "1.0":["127.0.0.1","127.0.0.2"],
            "2.0":["127.0.0.1","127.0.0.2"]
        },
    }
     * @type {{}}
     */
    NODES_CACHE = {};

/**
 * 后台服务API处理逻辑
 * @param req
 * @param res
 */
function handler(req,res) {
    utils.logger('------------------api请求处理--------------------');
    let service_name = req.headers['service-name'];
    let service_version = req.headers['version'];
    let serviceName = service_name?service_name:req.query['Service-Name'];
    let version = service_version?service_version:req.query['Version'];
    // FIXME 当前测试阶段手动指定为1.0版本 测试调整完成后要删掉下面这行代码
    if(!version)version = "1.0";
    utils.logger('请求服务：[%s],版本：[%s]',serviceName,version);

    if(!serviceName || !version){
        utils.logger('未指定服务名或版本信息');
        utils.response(res,'error','未指定服务名或版本信息');
        utils.logger('------------------api请求完成--------------------');
        return;
    }
    /***检查是否存在本地缓存 ***/
    if(!NODES_CACHE[serviceName]) {
        NODES_CACHE[serviceName] = {};
    }
    /*if(!NODES_CACHE[serviceName][version]){
        NODES_CACHE[serviceName][version] = [];
    }*/

    let nodes = NODES_CACHE[serviceName][version];
    utils.logger("读取服务缓存：%s",nodes&&nodes.length>0?"true":"false");
    // 缓存中存在当前服务可用节点，直接执行反向代理，否则检索服务注册中心
    if(nodes&&nodes.length >0) {
        utils.logger('可用节点:%j',nodes);
        doProxy(req,res,nodes);
        res.setHeader('Version',version);
    }else{
        let servicePath = config.register_root+'/'+serviceName;// + '/' +version;
        //连接zk服务注册中心获取服务
        let client = zk.createClient(config.zk_connect_url);
        client.once('connected', function () {
            // utils.logger('Connected to the registry server.');
            //先判断根节点是否存在
            client.exists(servicePath, function (error, stat) {
                if (error) {
                    utils.logger(error.stack);
                    return;
                }
                if (stat) {
                    // 处理版本信息
                    handlerVersion(client,servicePath,version,req,res);
                    // 方便节点状态监控实时更新服务节点缓存
                    // handlerApi(client,servicePath+'/'+version,req,res);
                } else {
                    utils.logger('服务模块不存在.');
                    utils.response(res,'error','服务模块不存在');
                    utils.logger('------------------api请求完成--------------------');
                }
            });
        });

        client.connect();
    }
};
//创建代理服务器对象并监听错误事件
const proxy = httpProxy.createProxyServer();
proxy.on('error', function (err, req, res) {
    utils.logger('后台模块服务不可用，无法正常转发');
    utils.response(res, 'error', '后台模块服务不可用，无法正常转发');
    utils.logger('------------------api请求完成--------------------');
});

/**
 * 处理版本信息
 * @param client
 * @param servicePath
 * @param version
 * @param req
 * @param res
 */
function handlerVersion(client,servicePath,version,req,res){
    client.getChildren(servicePath,function (error,versionNodes) {
        if (error) {
            utils.logger('Failed to list children of %s due to: %s.',servicePath, error);
            if(req && res) {//只有在主动请求时才转发请求，否则只做更新缓存操作
                utils.response(res, 'error', '连接到服务注册中心错误');
                utils.logger('------------------api请求完成--------------------');
                return;
            }
        }
        utils.logger('可用版本： %j.', versionNodes);
        if((req&&res) && versionNodes.indexOf(version) < 0){
            versionNodes.sort(function(x,y){return x-y});// 版本排序
            res.writeHead(505);
            res.setHeader('Version',versionNodes[0]+','+versionNodes[versionNodes.length-1]);
            utils.logger('Unsupported Version');
            utils.response(res, '505', 'Unsupported Version');
            return;
        }
        handlerServiceNode(client,servicePath+'/'+version,req,res);
    });
}

/**
 * 列出节点并监控，如果是请求，刷新缓存然后转发，如果是监控事件只更新缓存
 * @param  {[type]} client      [zk客户端对象]
 * @param  {[type]} servicePath [服务在注册中心对应路径]
 * @param  {[type]} req         [请求对象]
 * @param  {[type]} res         [响应对象]
 */
function handlerServiceNode(client,servicePath,req,res){
    client.getChildren(servicePath,function (event) {
        utils.logger('Got watcher event: %j', event);
        /*listChildren(client, path);*/
        //根节点节点变化清空缓存
        handlerServiceNode(client,servicePath);
    },function (error, addressNodes, stat) {
        if (error) {
            utils.logger('Failed to list children of %s due to: %s.',addressNodes, stat);
            if(req && res) {//只有在主动请求时才转发请求，否则只做更新缓存操作
                utils.response(res, 'error', '连接到服务注册中心错误');
                utils.logger('------------------api请求完成--------------------');
                return;
            }
        }
        utils.logger('可用节点： %j.', addressNodes);
        // 先缓存或更新缓存
        let version = servicePath.substring(servicePath.lastIndexOf('/')+1,servicePath.length);
        let serviceName = servicePath.substring(config.register_root.length+1,servicePath.lastIndexOf('/'));
        if(!addressNodes || addressNodes.length<=0){
            utils.logger('当前服务无可用节点.');
            if(req && res) {//只有在主动请求时才转发请求，否则只做更新缓存操作
                res.setHeader('Version',version);
                utils.response(res, 'error', '当前服务无可用节点');
                utils.logger('------------------api请求完成--------------------');
            }
        }else{

            NODES_CACHE[serviceName][version]=addressNodes;
            utils.logger('更新缓存：%j',NODES_CACHE);
            if(req && res){//只有在主动请求时才转发请求，否则只做更新缓存操作
                doProxy(req,res,addressNodes);
                res.setHeader('Version',version);
            }
        }
    });
}

/**
 * 执行反向代理
 * @param  {[type]} req             [请求]
 * @param  {[type]} res             [响应对象]
 * @param  {[type]} serverCacheList [服务可用节点缓存]
 * @return {[type]}                 [服务返回数据，json]
 */
function doProxy(req,res,serverCacheList) {
    let realPath = url.parse(req.url).pathname;
    // 使用ip hash策略 正常情况下，同一客户端请求会转发到同一服务器
    let clientIp = utils.getClientIp(req);
    let index = utils.hashCode(clientIp)%serverCacheList.length;
    utils.logger('请求ip：%s ，执行ip_hash策略: %d',clientIp,index);
    // let sPath = serverCacheList[parseInt(Math.random()*serverCacheList.length)],target_url = 'http://'+sPath;
    let sPath = serverCacheList[index],target_url = 'http://'+sPath;
    utils.logger("反向代理：%s ,请求时间：%s",target_url+realPath,new Date().toLocaleString());
    proxy.web(req,res,{
        target:target_url
    });
    utils.logger('------------------api请求完成--------------------');
}

module.exports = {
    handler: handler
};