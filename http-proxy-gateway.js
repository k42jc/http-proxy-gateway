const os = require('os');
const cluster = require('cluster');
const config = require('./lib/config').config;
const server = require('./lib/server');
const numCPUs = os.cpus().length;

/**
 * node集群
 */
if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);

    // Fork node-http-server cluster workers.
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on(
        'exit',
        (worker, code, signal) => {
            console.log(`worker ${worker.process.pid} died`);
        }
    );
} else {
    // http服务器
    server.createStaticSever();
    server.createApiSever();

    console.log(`Worker ${process.pid} started HTTP ${config.http_port} HTTPS ${config.https_port}`);
}