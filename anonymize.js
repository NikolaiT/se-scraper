const proxyChain = require('proxy-chain');

(async() => {
    const oldProxyUrl = process.env.UPSTREAM_PROXY_URL;
    const newProxyUrl = await proxyChain.anonymizeProxy(oldProxyUrl);

    // Prints something like "http://127.0.0.1:45678"
    console.log(newProxyUrl);
    
})();