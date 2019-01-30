const start_url = {
    'google': ''
};

/*
    Get useful JS knowledge and get awesome...

    Read this shit: https://javascript.info/class-inheritance
    And this: https://medium.freecodecamp.org/here-are-examples-of-everything-new-in-ecmascript-2016-2017-and-2018-d52fa3b5a70e
 */

module.exports = class Scraper {
    constructor(options = {}) {
        const {
            browser = null,
            config = {},
            context = {},
            pluggable = null,
        } = options;

        this.pluggable = pluggable;
        this.browser = browser;
        this.config = config;
        this.context = context;

        this.STANDARD_TIMEOUT = 8000;
        // longer timeout when using proxies
        this.PROXY_TIMEOUT = 15000;
        this.SOLVE_CAPTCHA_TIME = 45000;

        this.results = {};
    }

    async run() {

        let do_continue = await this.load_search_engine();

        if (!do_continue) {
            console.error('Failed to load the search engine: load_search_engine()');
            return this.results;
        }

        await this.scraping_loop();

        return this.results;
    }

    /**
     * Action that runs only once in the beginning of the
     * scraping procedure.
     *
     * @returns {Promise<void>} true if everything is correct.
     */
    async load_search_engine() {

        this.page = await this.browser.newPage();

        // block some assets to speed up scraping
        if (this.config.block_assets === true) {
            await this.page.setRequestInterception(true);
            this.page.on('request', (req) => {
                let type = req.resourceType();
                const block = ['stylesheet', 'font', 'image', 'media'];
                if (block.includes(type)) {
                    req.abort();
                } else {
                    req.continue();
                }
            });
        }

        return await this.load_start_page();
    }

    /**
     * Each scraper basically iterates over a list of
     * keywords and a list of pages. This is the generic
     * method for that.
     *
     * @returns {Promise<void>}
     */
    async scraping_loop() {

        for (let keyword of this.config.keywords) {

            this.results[keyword] = {};

            if (this.pluggable.before_keyword_scraped) {
                await this.pluggable.before_keyword_scraped({
                    keyword: keyword,
                    page: this.page,
                    event: this.config,
                    context: this.context,
                });
            }

            let page_num = 1;

            try {

                await this.search_keyword(keyword);

                do {

                    if (this.config.verbose === true) {
                        console.log(`${this.config.search_engine} scrapes keyword "${keyword}" on page ${page_num}`);
                    }

                    await this.wait_for_results();

                    if (event.sleep_range) {
                        await this.random_sleep();
                    }

                    let html = await this.page.content();
                    this.results[keyword][page_num] = this.parse(html);

                    page_num += 1;

                    if (await this.next_page() === false) {
                        break;
                    }

                } while (page_num < event.num_pages);

            } catch (e) {

                console.error(`Problem with scraping ${keyword} in search engine ${this.config.search_engine}: ${e}`);

                if (await this.detected() === true) {
                    console.error(`${this.config.search_engine} DETECTED the scraping!`);

                    if (this.config.is_local === true) {
                        await this.sleep(this.SOLVE_CAPTCHA_TIME);
                        console.error(`You have ${this.SOLVE_CAPTCHA_TIME}ms to enter the captcha.`);
                        // expect that user filled out necessary captcha
                    } else {
                        break;
                    }
                } else {
                    // some other error, quit scraping process if stuff is broken
                    if (this.config.is_local === true) {
                        console.error('You have 30 seconds to fix this.');
                        await this.sleep(30000);
                    } else {
                        break;
                    }
                }

            }
        }
    }

    sleep(ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms)
        })
    }

    async random_sleep() {
        const [min, max] = this.config.sleep_range;
        let rand = Math.floor(Math.random() * (max - min + 1) + min); //Generate Random number
        if (this.config.debug === true) {
            console.log(`Sleeping for ${rand}s`);
        }
        await this.sleep(rand * 1000);
    }

    async set_input_value(selector, value) {
        await this.page.waitFor(selector);
        await this.page.evaluate((value, selector) => {
            return document.querySelector(selector).value = value;
        }, value, selector);
    }

    no_results(needles, html) {
        return !needles.map((needle) => { return html.indexOf(needle)})
            .every((res) => { return res == -1});
    }

    parse(html) {

    }

    /**
     *
     * @returns true if startpage was loaded correctly.
     */
    async load_start_page() {

    }

    /**
     * Searches the keyword by inputting it into the form and hitting enter
     * or something similar.
     *
     * @param keyword
     * @returns {Promise<void>}
     */
    async search_keyword(keyword) {

    }

    /**
     *
     * @returns true if the next page was loaded correctely
     */
    async next_page() {

    }

    async wait_for_results() {

    }

    async detected() {

    }
};