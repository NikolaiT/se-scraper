const meta = require('./metadata.js');
const common = require('./common.js');
var log = common.log;

/*
    Get useful JS knowledge and get awesome...

    Read this shit: https://javascript.info/class-inheritance
    And this: https://medium.freecodecamp.org/here-are-examples-of-everything-new-in-ecmascript-2016-2017-and-2018-d52fa3b5a70e
 */

module.exports = class Scraper {
    constructor(options = {}) {
        const {
            config = {},
            context = {},
            pluggable = null,
            page = null,
        } = options;

        this.page = page;
        this.last_response = null; // the last response object
        this.metadata = {};
        this.pluggable = pluggable;
        this.config = config;
        this.context = context;

        this.proxy = config.proxy;
        this.keywords = config.keywords;

        this.STANDARD_TIMEOUT = 10000;
        // longer timeout when using proxies
        this.PROXY_TIMEOUT = 15000;
        this.SOLVE_CAPTCHA_TIME = 45000;

        this.results = {};
        this.result_rank = 1;
        // keep track of the requests done
        this.num_requests = 0;
        // keep track of the keywords searched
        this.num_keywords = 0;

        let settings = this.config[`${this.config.search_engine}_settings`];
        if (settings) {
            if (typeof settings === 'string') {
                try {
                    settings = JSON.parse(settings);
                    this.config[`${this.config.search_engine}_settings`] = settings;
                } catch (e) {
                    console.error(e);
                }
            }
        }

    }

    async run({page, data}) {

        if (page) {
            this.page = page;
        }

        await this.page.setViewport({ width: 1920, height: 1040 });

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

        if (this.config.apply_evasion_techniques === true) {
            // prevent detection by evading common detection techniques
            await evadeChromeHeadlessDetection(this.page);
        }

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

        if (this.config.test_evasion === true) {
            // Navigate to the page that will perform the tests.
            const testUrl = 'https://intoli.com/blog/' +
                'not-possible-to-block-chrome-headless/chrome-headless-test.html';
            await this.page.goto(testUrl);

            // Save a screenshot of the results.
            await this.page.screenshot({path: 'headless-test-result.png'});
        }

        if (this.config.log_http_headers === true) {
            this.metadata.http_headers = await meta.get_http_headers(this.page);
        }

        if (this.config.log_ip_address === true) {
            let ipinfo = await meta.get_ip_data(this.page);
            this.metadata.ipinfo = ipinfo;
        }

        // check that our proxy is working by confirming
        // that ipinfo.io sees the proxy IP address
        if (this.proxy && this.config.log_ip_address === true) {
            log(this.config, 3, `${this.metadata.ipinfo.ip} vs ${this.proxy}`);

            try {
                // if the ip returned by ipinfo is not a substring of our proxystring, get the heck outta here
                if (!this.proxy.includes(this.metadata.ipinfo.ip)) {
                    console.error(`Proxy ${this.proxy} does not work.`);
                    return false;
                } else {
                    log(this.config, 1, `Using valid Proxy: ${this.proxy}`);
                }
            } catch (exception) {
            }
        }

        try {
            return await this.load_start_page();
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    /**
     * Each scraper basically iterates over a list of
     * keywords and a list of pages. This is the generic
     * method for that.
     *
     * @returns {Promise<void>}
     */
    async scraping_loop() {
        for (var keyword of this.keywords) {
            this.num_keywords++;
            this.keyword = keyword;
            this.results[keyword] = {};
            this.result_rank = 1;

            if (this.pluggable && this.pluggable.before_keyword_scraped) {
                await this.pluggable.before_keyword_scraped({
                    results: this.results,
                    num_keywords: this.num_keywords,
                    num_requests: this.num_requests,
                    keyword: keyword,
                    page: this.page,
                    config: this.config,
                    context: this.context,
                });
            }

            this.page_num = 1;

            try {

                await this.search_keyword(keyword);
                // when searching the keyword fails, num_requests will not
                // be incremented.
                this.num_requests++;

                do {

                    log(this.config, 1, `${this.config.search_engine_name} scrapes keyword "${keyword}" on page ${this.page_num}`);

                    await this.wait_for_results();

                    if (this.config.sleep_range) {
                        await this.random_sleep();
                    }

                    let html = await this.page.content();
                    let parsed = this.parse(html);
                    this.results[keyword][this.page_num] = parsed ? parsed : await this.parse_async(html);

                    this.page_num += 1;

                    // only load the next page when we will pass the next iteration
                    // step from the while loop
                    if (this.page_num <= this.config.num_pages) {

                        let next_page_loaded = await this.next_page();

                        if (next_page_loaded === false) {
                            break;
                        } else {
                            this.num_requests++;
                        }
                    }

                } while (this.page_num <= this.config.num_pages);

            } catch (e) {

                console.error(`Problem with scraping ${keyword} in search engine ${this.config.search_engine_name}: ${e}`);

                if (this.last_response) {
                    log(this.config, 2, this.last_response);
                }

                try {
                    // Try to save a screenshot of the error
                    await this.page.screenshot({path: `debug_se_scraper_${this.config.search_engine_name}_${keyword}.png`});
                } catch (e) {
                }

                if (await this.detected() === true) {
                    console.error(`${this.config.search_engine_name} detected the scraping!`);

                    if (this.config.is_local === true) {
                        await this.sleep(this.SOLVE_CAPTCHA_TIME);
                        console.error(`You have ${this.SOLVE_CAPTCHA_TIME}ms to enter the captcha.`);
                        // expect that user filled out necessary captcha
                    } else {
                        if (this.config.throw_on_detection === true) {
                            throw( e );
                        } else {
                            break;
                        }
                    }
                } else {
                    // some other error, quit scraping process if stuff is broken
                    if (this.config.is_local === true) {
                        console.error('You have 30 seconds to fix this.');
                        await this.sleep(30000);
                    } else {
                        if (this.config.throw_on_detection === true) {
                            throw( e );
                        } else {
                            break;
                        }
                    }
                }

            }
        }
    }

    /**
     * Generic function to append queryArgs to a search engine url.
     *
     * @param: The baseUrl to use for the build process.
     */
    build_start_url(baseUrl) {
        let settings = this.config[`${this.config.search_engine}_settings`];

        if (settings) {
            for (var key in settings) {
                baseUrl += `${key}=${settings[key]}&`
            }

            log(this.config, 1, 'Using startUrl: ' + baseUrl);

            return baseUrl;
        }

        return false;
    }

    sleep(ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms)
        })
    }

    async random_sleep() {
        const [min, max] = this.config.sleep_range;
        let rand = Math.floor(Math.random() * (max - min + 1) + min); //Generate Random number
        log(this.config, 1, `Sleeping for ${rand}s`);
        await this.sleep(rand * 1000);
    }

    async set_input_value(selector, value) {
        await this.page.waitFor(selector);
        await this.page.evaluate((value, selector) => {
            return document.querySelector(selector).value = value;
        }, value, selector);
    }

    no_results(needles, html) {
        for (let needle of needles) {
            if (html.includes(needle)) {
                console.log(this.config, 2, `HTML contains needle ${needle}. no_results=true`);
                return true;
            }
        }
        return false;
    }

    parse(html) {

    }

    async parse_async(html) {

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

// This is where we'll put the code to get around the tests.
async function evadeChromeHeadlessDetection(page) {

    try {
        // Pass the Webdriver Test.
        await page.evaluateOnNewDocument(() => {
            const newProto = navigator.__proto__;
            delete newProto.webdriver;
            navigator.__proto__ = newProto;
        });

        // Pass the Chrome Test.
        await page.evaluateOnNewDocument(() => {
            // We can mock this in as much depth as we need for the test.
            const mockObj = {
                app: {
                    isInstalled: false,
                },
                webstore: {
                    onInstallStageChanged: {},
                    onDownloadProgress: {},
                },
                runtime: {
                    PlatformOs: {
                        MAC: 'mac',
                        WIN: 'win',
                        ANDROID: 'android',
                        CROS: 'cros',
                        LINUX: 'linux',
                        OPENBSD: 'openbsd',
                    },
                    PlatformArch: {
                        ARM: 'arm',
                        X86_32: 'x86-32',
                        X86_64: 'x86-64',
                    },
                    PlatformNaclArch: {
                        ARM: 'arm',
                        X86_32: 'x86-32',
                        X86_64: 'x86-64',
                    },
                    RequestUpdateCheckStatus: {
                        THROTTLED: 'throttled',
                        NO_UPDATE: 'no_update',
                        UPDATE_AVAILABLE: 'update_available',
                    },
                    OnInstalledReason: {
                        INSTALL: 'install',
                        UPDATE: 'update',
                        CHROME_UPDATE: 'chrome_update',
                        SHARED_MODULE_UPDATE: 'shared_module_update',
                    },
                    OnRestartRequiredReason: {
                        APP_UPDATE: 'app_update',
                        OS_UPDATE: 'os_update',
                        PERIODIC: 'periodic',
                    },
                },
            };

            window.navigator.chrome = mockObj;
            window.chrome = mockObj;
        });

        // Pass the Permissions Test.
        await page.evaluateOnNewDocument(() => {
            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.__proto__.query = parameters =>
                parameters.name === 'notifications'
                    ? Promise.resolve({state: Notification.permission})
                    : originalQuery(parameters);

            // Inspired by: https://github.com/ikarienator/phantomjs_hide_and_seek/blob/master/5.spoofFunctionBind.js
            const oldCall = Function.prototype.call;

            function call() {
                return oldCall.apply(this, arguments);
            }

            Function.prototype.call = call;

            const nativeToStringFunctionString = Error.toString().replace(/Error/g, "toString");
            const oldToString = Function.prototype.toString;

            function functionToString() {
                if (this === window.navigator.permissions.query) {
                    return "function query() { [native code] }";
                }
                if (this === functionToString) {
                    return nativeToStringFunctionString;
                }
                return oldCall.call(oldToString, this);
            }

            Function.prototype.toString = functionToString;
        });

        // Pass the Plugins Length Test.
        await page.evaluateOnNewDocument(() => {
            // Overwrite the `plugins` property to use a custom getter.
            Object.defineProperty(navigator, 'plugins', {
                // This just needs to have `length > 0` for the current test,
                // but we could mock the plugins too if necessary.
                get: () => [1, 2, 3, 4, 5]
            });
        });

        // Pass the Languages Test.
        await page.evaluateOnNewDocument(() => {
            // Overwrite the `plugins` property to use a custom getter.
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en']
            });
        });

        // Pass the iframe Test
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
                get: function () {
                    return window;
                }
            });
        });

        // Pass toString test, though it breaks console.debug() from working
        await page.evaluateOnNewDocument(() => {
            window.console.debug = () => {
                return null;
            };
        });

    } catch (e) {
        console.error(e);
    }
}