const { Cluster } = require('../../puppeteer-cluster/dist/index.js');
var fs = require('fs');
var os = require("os");

const PROXY_FILE = '/home/nikolai/.proxies';

function read_items_from_file(fname) {
    let kws =  fs.readFileSync(fname).toString().split(os.EOL);
    // clean keywords
    kws = kws.filter((kw) => {
        return kw.trim().length > 0;
    });
    return kws;
}

(async () => {

    let browserArgs = [
        '--disable-infobars',
        '--window-position=0,0',
        '--ignore-certifcate-errors',
        '--ignore-certifcate-errors-spki-list',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080',
        '--hide-scrollbars',
    ];

    let proxies = read_items_from_file(PROXY_FILE);

    console.dir(proxies);

    // each new call to workerInstance() will
    // left pop() one element from this list
    // maxConcurrency should be equal to perBrowserOptions.length

    // the first browser config with home IP
    let perBrowserOptions = [{
        headless: false,
        ignoreHTTPSErrors: true,
        args: browserArgs
    }];

    for (var proxy of proxies) {
        perBrowserOptions.push({
            headless: false,
            ignoreHTTPSErrors: true,
            args: browserArgs.concat(`--proxy-server=${proxy}`)
        })
    }

    const cluster = await Cluster.launch({
        monitor: true,
        timeout: 12 * 60 * 60 * 1000, // 12 hours in ms
        concurrency: Cluster.CONCURRENCY_BROWSER,
        maxConcurrency: perBrowserOptions.length,
        puppeteerOptions: {
            headless: false,
            args: browserArgs,
            ignoreHTTPSErrors: true,
        },
        perBrowserOptions: perBrowserOptions
    });

    // Event handler to be called in case of problems
    cluster.on('taskerror', (err, data) => {
        console.log(`Error crawling ${data}: ${err.message}`);
    });


    await cluster.task(async ({ page, data: url }) => {
        await page.goto(url, {waitUntil: 'domcontentloaded', timeout: 20000});
        const pageTitle = await page.evaluate(() => document.title);
        console.log(`Page title of ${url} is ${pageTitle}`);
        console.log(await page.content());
    });

    for(var i = 0; i < perBrowserOptions.length; i++) {
        await cluster.queue('http://ipinfo.io/json');
    }

    await cluster.idle();
    await cluster.close();
})();
