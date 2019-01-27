module.exports = class Pluggable {
    constructor(options = {}) {
        const {
            chromeFlags = [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920x1080',
                '--hide-scrollbars',
                '--user-agent=Chrome',
            ],
            userAgent = 'Chrome',
            headless = true,
        } = options;

        this.chromeFlags = chromeFlags;
        this.userAgent = userAgent;
        this.headless = headless;

        this.chromeFlags.push(this.userAgent);
    }

    async close_browser() {
        await this.browser.close();
    }

    async handle_metadata(args) {
        // store scraping metadata somewhere
    }

    async handle_results(args) {
        // store the results somewhere
    }

    async start_browser(args={}) {
        const puppeteer = require('puppeteer');

        let launch_args = {
            args: args.chromeFlags || this.chromeFlags,
            headless: args.headless,
        };

        if (launch_args.headless === undefined) {
            launch_args.headless = this.headless;
        }

        this.browser = await puppeteer.launch(launch_args);
        console.log('Loaded custom function get_browser()');
        console.log(launch_args);

        return this.browser;
    }
};