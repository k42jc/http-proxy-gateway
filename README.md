前置http服务器网关模块

使用Node.js代替Nginx服务器，但是更灵活，最大限度定制化

运维非专业Noder，最开始找资料使用http、https模块实现自己的http服务器，但是问题挺多，后面使用[http-server](https://github.com/indexzero/http-server)作为基础http/https服务，不过稍微做了一点修改，更好的支持自定义请求头跨域

见：lib/http-server.js


## 特性

* 负载均衡与反向代理
* 跨域
* HTTP/HTTPS
* 监听zk服务注册中心，服务动态上下线/扩容完美支持
* 动态环境Profile配置区分

## 使用

	node http-proxy-gateway.js #如果提示模块找不到请先安装依赖

推荐使用forever，后台启动且方便监控日志

	forever start http-proxy-gateway.js #启动成功后会列出日志文件目录
	或使用下面命令查看有多少后台node进程
	forever list 

## 性能测试

使用AB测试，吞吐量还不错，没有经过大量测试