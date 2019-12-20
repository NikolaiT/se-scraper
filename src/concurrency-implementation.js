const { Browser } = require('puppeteer-cluster/dist/concurrency/builtInConcurrency');
const debug = require('debug')('se-scraper:CustomConcurrency');
const { timeoutExecute } = require('puppeteer-cluster/dist/util');

const BROWSER_TIMEOUT = 5000;

class CustomConcurrency extends Browser {

    async init() {}
    async close() {}

    async workerInstance() {
        const options = this.options.perBrowserOptions.shift();
        let chrome = await this.puppeteer.launch(options);
        let page;
        let context;

        return {
            jobInstance: async () => {
                await timeoutExecute(BROWSER_TIMEOUT, (async () => {
                    context = await chrome.createIncognitoBrowserContext();
                    page = await context.newPage();
                })());

                return {
                    resources: {
                        page,
                    },

                    close: async () => {
                        await timeoutExecute(BROWSER_TIMEOUT, context.close());
                    },
                };
            },

            close: async () => {
                await chrome.close();
            },

            repair: async () => {
                debug('Starting repair');
                try {
                    // will probably fail, but just in case the repair was not necessary
                    await chrome.close();
                } catch (e) {}

                // just relaunch as there is only one page per browser
                chrome = await this.puppeteer.launch(options);
            },
        };
    }
};

module.exports = CustomConcurrency;