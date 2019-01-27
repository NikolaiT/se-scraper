module.exports = {
    get_browser: get_browser,
    handle_metadata: handle_metadata,
    close_browser: close_browser
};

async function close_browser(browser) {
    await browser.close();
}

async function handle_metadata() {
    // silence
}

async function get_browser(launch_args) {
    const puppeteer = require('puppeteer');

    const ADDITIONAL_CHROME_FLAGS = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080',
        '--hide-scrollbars',
        '--user-agent=Chrome',
    ];

    let custom_args = {
        args: ADDITIONAL_CHROME_FLAGS,
        headless: true,
    };

    browser = await puppeteer.launch(launch_args);

    console.log('Loaded custom function get_browser()');

    return browser;
}