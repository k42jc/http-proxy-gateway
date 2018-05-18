// 网关配置 注意区分环境配置
/*********************************/
const profile_active = 'prod';
/*********************************/
_config = {
    "register_root":"/registry", // 后台API服务注册中心根目录
    "service_tag":"Service-Name", // 头部服务名key
    "cors_headers": 'Service-Name, Token, PageNum, PageSize, Version, Client-Version',
    "cors_methods": 'GET,POST,DELETE,PUT',
    "charset":"utf-8", // 默认编码
    "api_path":"/api/", // api接口访问uri
    "auth_path": "/static/",//需要认证的请求路径,多个使用,逗号分隔
    "http_base_auth_user_pwd": "Admin:admin" // 基本http认证用户名密码
};

profile = {
    "local":{
        "http_port":8002, //http端口
        "host": "10.34.2.31",
        "http_root":'./public', //http服务器根目录，与nginx的root一致
        "https_port":8015, // https端口
        "ssl_key_path":"私钥", // ssl私钥目录 开发
        "ssl_crt_path":"证书", // ssl证书目录*/
        "file_save_path":"本地文件上传",// 本地开发环境
        "zk_connect_url":"",// zk服务器连接url，集群使用逗号分隔
        "http_allow_path": "/api/"//需要允许HTTP的预审请求uri
    },
    "dev":{
        "host": "10.34.2.8",// 访问host或域名
        "zk_connect_url":"", //zk服务注册中心地址
        "http_port":8001, //http端口
    //    "http_root":'D:\\Users\\liaoxudong\\Desktop\\dist', //http服务器根目录，与nginx的root一致
        "https_port":8014, // https端口
        "ssl_key_path":"", // ssl私钥目录
        "ssl_crt_path":"", // ssl证书目录
        "certbot_webroot_path":"/usr/local/yihui/gateway", //Let's Encrypt Cerbot证书注册,
        "assets_path":"/assets/", // 静态文件访问uri
        "file_save_path":"/data/assets/",
        "http_allow_path": "/api/"//需要允许HTTP的预审请求uri

    },
    "test":{
        "host": "测试环境域名",
        "http_port":80, //http端口
        "https_port":443, // https端口
        "zk_connect_url":"svc0:2181", //zk服务注册中心地址
        "ssl_key_path":"/etc/letsencrypt/live/测试环境域名/privkey.pem", // ssl私钥目录
        "ssl_crt_path":"/etc/letsencrypt/live/测试环境域名/fullchain.pem", // ssl证书目录
        "http_allow_path": "/api/preAudit/",//需要允许HTTP的预审请求uri
	"ms_server_path": "http://svc0:8888"
    },
    "pre_prod":{
        "host": "运维环境域名",
        "http_port":81, //http端口
        "https_port":444, // https端口
        "zk_connect_url":"svc1:2182", //zk服务注册中心地址
        "ssl_key_path":"/etc/letsencrypt/live/运维环境域名/privkey.pem", // ssl私钥目录
        "ssl_crt_path":"/etc/letsencrypt/live/运维环境域名/fullchain.pem", // ssl证书目录
        "http_allow_path": "/api/preAudit/",//需要允许HTTP的预审请求uri
	"ms_server_path": "http://db0:8888"
    },
    "prod":{
        "host": "正式域名",
        "http_port":80, //http端口
        "https_port":443, // https端口
        "zk_connect_url":"cache:12181", //zk服务注册中心地址
        "ssl_key_path":"/etc/letsencrypt/live/正式域名/privkey.pem", // ssl私钥目录
        "ssl_crt_path":"/etc/letsencrypt/live/正式域名/fullchain.pem", // ssl证书目录
        "http_allow_path": "/api/preAudit/",//需要允许HTTP的预审请求uri
	"ms_server_path": "http://svc1:8888"
    }
};
function config(){
    if(profile_active === 'local') {
        return Object.assign(_config,profile.local);
    }
    if(profile_active === 'dev') {
        return Object.assign(_config,profile.dev)
    }
    if(profile_active === 'test') {
        return Object.assign(_config,profile.test)
    }
    if(profile_active === 'pre_prod') {
        return Object.assign(_config,profile.pre_prod)
    }
    if(profile_active === 'prod') {
        return Object.assign(_config,profile.prod)
    }
}

expires = {
    fileMatch: /^(gif|png|jpg|js|css|mp4)$/ig,
    maxAge: 60*60*24*365
};

// 文档类型
mimeTypes =  {
    "css": "text/css",
    "gif": "image/gif",
    "html": "text/html",
    "ico": "image/x-icon",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "js": "text/javascript",
    "json": "application/json",
    "pdf": "application/pdf",
    "png": "image/png",
    "svg": "image/svg+xml",
    "swf": "application/x-shockwave-flash",
    "tiff": "image/tiff",
    "txt": "text/plain",
    "wav": "audio/x-wav",
    "wma": "audio/x-ms-wma",
    "wmv": "video/x-ms-wmv",
    "xml": "text/xml"
}

module.exports = {
    config: config(),
    expires: expires,
    mimeTypes: mimeTypes,
};
