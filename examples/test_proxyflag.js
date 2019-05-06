const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        args: [
            // SET PROXY HERE
            '--proxy-server=socks5://IP:PORT',
            '--disable-infobars',
            '--window-position=0,0',
            '--ignore-certifcate-errors',
            '--ignore-certifcate-errors-spki-list',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--window-size=1920x1080',
            '--hide-scrollbars',
            '--disable-notifications',
            '--no-sandbox',
            '--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/71.0.3578.98 Chrome/71.0.3578.98 Safari/537.36'
        ],
        headless: true
    });
    var page = await browser.newPage();
    await page.setViewport({width: 1920, height: 926});
    await page.goto('http://ipinfo.io/json');
    console.log(await page.content());
    await browser.close();
})();