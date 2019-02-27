const puppeteer = require('puppeteer');
const ProxyChain = require('proxy-chain');

const ROUTER_PROXY = 'http://127.0.0.1:8000';

// SEE: https://github.com/GoogleChrome/puppeteer/issues/678
// Idea is: Setup a local router proxy that assigns requests identified by unique user-agent strings
// distinct upstream proxies. With this way it is possible to use one proxy per chromium tab.
// downside: not fast and efficient

const uas = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.139 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
];

const proxies = ['http://142.93.57.147:3128', 'http://85.132.31.115:8181'];

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        args: [`--proxy-server=${ROUTER_PROXY}`],
    });
    const page1 = await browser.newPage();
    const page2 = await browser.newPage();

    try {
        await page1.setUserAgent(uas[0]);
        await page1.goto('https://www.whatsmyip.org/');
    } catch (e) {
        console.log(e);
    }

    try {
        await page2.setUserAgent(uas[1]);
        await page2.goto('https://www.whatsmyip.org/');
    } catch (e) {
        console.log(e);
    }

    //await browser.close();
})();

const server = new ProxyChain.Server({
    // Port where the server the server will listen. By default 8000.
    port: 8000,

    // Enables verbose logging
    verbose: true,

    prepareRequestFunction: ({
                                 request,
                                 username,
                                 password,
                                 hostname,
                                 port,
                                 isHttp,
                             }) => {
        var upstreamProxyUrl;

        if (request.headers['user-agent'] === uas[0]) {
            upstreamProxyUrl = proxies[0];
        }

        if (request.headers['user-agent'] === uas[1]) {
            upstreamProxyUrl = proxies[1];
        }

        console.log('Using proxy: ' + upstreamProxyUrl);

        return { upstreamProxyUrl };
    },
});

server.listen(() => {
    console.log(`Router Proxy server is listening on port ${8000}`);
});