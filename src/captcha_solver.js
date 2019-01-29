/*
    There are essentially two strategies to handle a search engine showing you a captcha:

    1. Solve the captcha
        https://github.com/ecthros/uncaptcha2
        or use a captcha solving service such as https://anti-captcha.com/mainpage

    2. Switch your IP address with rotating proxies

 */

/**
 * @name download recaptcha2 audio captcha
 *
 * There are several issues:
 *
 * Google sees that we are using an automated browser.
 *
 * In the worst case we have to completely control the browser ourselves without puppeteer.
 *
 * https://github.com/ecthros/uncaptcha2
 *
 * See here:
 *
 * https://gist.github.com/tegansnyder/c3aeae4d57768c58247ae6c4e5acd3d1
 *
 * https://github.com/GoogleChrome/puppeteer/issues/3039
 *
 * https://intoli.com/blog/making-chrome-headless-undetectable/
 *
 * @desc  Go to the https://www.google.com/recaptcha/api2/demo demo page and download the captcha
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const got = require('got');

try {
    (async () => {
        const browser = await puppeteer.launch({
            args:  [
                '--proxy-server=socks5://78.94.172.42:1080',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920x1080',
                '--hide-scrollbars',
                '--user-agent="Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:64.0) Gecko/20100101 Firefox/64.0"',
            ],
            headless: false,
        });
        const page = await browser.newPage()
        await page.goto('https://www.google.com/recaptcha/api2/demo')

        await page.waitFor(1000);

        const frames = page.frames();

        console.info('Available frames', frames.map(frame => frame.name()));
        console.info('Available frame urls', frames.map(frame => frame.url()));

        const frame = frames.find(frame => frame.url().includes('/recaptcha/api2/anchor?'));
        const content_frame = frames.find(frame => frame.url().includes('/recaptcha/api2/bframe?'));

        await frame.waitForSelector('#recaptcha-anchor', { timeout: 10000 });
        await page.waitFor(1000);
        const button = await frame.$('#recaptcha-anchor');
        await button.click();

        await content_frame.waitForSelector('#recaptcha-audio-button');

        const audio_button = await content_frame.$('#recaptcha-audio-button');
        await audio_button.click();
        await page.waitFor(1000);

        await content_frame.waitForSelector('.rc-audiochallenge-tdownload-link');

        let download_link = await content_frame.evaluate(() => {
            return document.querySelectorAll('.rc-audiochallenge-tdownload-link').getAttribute('href');
        });
        console.log('Got audio download link: ', download_link);
        got.stream(download_link).pipe(fs.createWriteStream('audio.mp3'));

        await browser.close();
    })()
} catch (err) {
    console.error(err)
}

/*
    translate this shit into js: https://github.com/ecthros/uncaptcha2/blob/master/queryAPI.py
 */
async function translate_audio_file() {
}