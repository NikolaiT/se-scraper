'use strict';

const Scraper = require('./se_scraper');
const common = require('./common.js');
var log = common.log;

class YandexScraper extends Scraper {

    constructor(...args) {
        super(...args);
    }

    async parse_async(html) {

        let results = await this.page.evaluate(() => {
            let serp_items =  document.querySelectorAll('.serp-item');
            const data = [];
            serp_items.forEach((item) => {
                let obj = {
                    is_ad: false,
                };
                try {
                    if (item) {

                        let linkElement = item.querySelector('a.link');

                        if (linkElement) {
                            obj.link = linkElement.getAttribute('href');
                            obj.title = linkElement.innerText;

                            let label = linkElement.querySelector('.organic__subtitle .label');

                            if (label) {
                                let labelText = label.innerText;
                                if (labelText.trim() === 'ad') {
                                    obj.is_ad = true;
                                }
                            }
                        }

                        obj.snippet = item.querySelector('.text-container.typo').innerText;
                        obj.visible_link = item.querySelector('.typo_type_greenurl').innerText;

                        if (obj.title) {
                            data.push(obj);
                        }
                    }
                } catch (e) {
                }
            });
            return data;
        });

        let num_results = await this.page.evaluate(() => {
            let num_results =  document.querySelector('.serp-adv__found');
            if (num_results) {
                return num_results.innerText;
            }
        });

        const cleaned = this.clean_results(results, ['title', 'link' , 'snippet']);

        return {
            time: (new Date()).toUTCString(),
            num_results: num_results,
            results: cleaned,
        };
    }

    async load_start_page() {
        let startUrl = 'https://yandex.com';

        log(this.config, 1, 'Using startUrl: ' + startUrl);

        this.last_response = await this.page.goto(startUrl);

        await this.page.waitForSelector('input[name="text"]', { timeout: this.STANDARD_TIMEOUT });

        return true;
    }

    async search_keyword(keyword) {
        const input = await this.page.$('input[name="text"]');
        await this.set_input_value(`input[name="text"]`, keyword);
        await this.sleep(50);
        await input.focus();
        await this.page.keyboard.press("Enter");
    }

    async next_page() {
        let next_page_link = await this.page.$('.pager .pager__item_kind_next', {timeout: 1000});
        if (!next_page_link) {
            return false;
        }
        await next_page_link.click();

        return true;
    }

    async wait_for_results() {
        await this.page.waitForSelector('.main__content', { timeout: this.STANDARD_TIMEOUT });
    }

    async detected() {

    }
}

module.exports = {
    YandexScraper: YandexScraper,
};