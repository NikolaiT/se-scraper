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
                '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3835.0 Safari/537.36',
            ],
            headless = true,
        } = options;

        this.chromeFlags = chromeFlags;
        this.headless = headless;
    }

    async close_browser() {
        await this.browser.close();
    }

    // Callback invoked after metadata has been gathered
    async handle_metadata(args) {
        // store scraping metadata somewhere
    }

    // Callback invoked after all keywords have been scraped
    async handle_results(args) {
        // store the results somewhere
    }

    // Callback invoked before a keyword is scraped.
    async before_keyword_scraped(args) {
        console.log('before keyword scraped.');
    }

    // Callback invoked after a keyword has been scraped.
    // TODO: implement this
    async after_keyword_scraped(args) {
        console.log('after keyword scraped.')
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

    async do_work(page) {
        // do some scraping work and return results and num_requests

    }
};