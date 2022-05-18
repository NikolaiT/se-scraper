const cheerio = require('cheerio');
const Scraper = require('./se_scraper');

class BingScraper extends Scraper {
    
    defaultStartUrl = this.build_start_url('https://www.bing.com/search?') || 'https://www.bing.com/';

    async parse_async(html) {

        let results = await this.page.evaluate(() => {

            let _text = (el, s) => {
                let n = el.querySelector(s);

                if (n) {
                    return n.innerText;
                } else {
                    return '';
                }
            };

            let _attr = (el, s, attr) => {
                let n = el.querySelector(s);

                if (n) {
                    return n.getAttribute(attr);
                } else {
                    return null;
                }
            };

            let results = {
                num_results: '',
                no_results: false,
                effective_query: '',
                results: [],
                ads: [],
                right_side_ads: [],
            };

            let num_results_el = document.querySelector('#b_content .sb_count');

            if (num_results_el) {
                results.num_results = num_results_el.innerText;
            }

            let organic_results = document.querySelectorAll('#b_content #b_results .b_algo');

            organic_results.forEach((el) => {

                let serp_obj = {
                    link: _attr(el, 'h2 a', 'href'),
                    title: _text(el, 'h2'),
                    snippet: _text(el, '.b_caption p'),
                    visible_link: _text(el, 'cite'),
                };

                results.results.push(serp_obj);
            });

            // check if no results
            results.no_results = (results.results.length === 0);

            // parse bing ads
            let ads = document.querySelectorAll('#b_results .b_ad .sb_add');

            ads.forEach((el) => {

                let ad_obj = {
                    title: _text(el, 'h2 a'),
                    snippet: _text(el, '.b_caption p'),
                    visible_link: _text(el, '.b_adurl cite'),
                    tracking_link: _attr(el, 'h2 a', 'href'),
                };

                results.ads.push(ad_obj);
            });

            // right side ads
            let right_side_ads = document.querySelectorAll('#b_context .b_ad .sb_add');

            right_side_ads.forEach((el) => {

                let ad_obj = {
                    title: _text(el, 'h2 a'),
                    snippet: _text(el, '.b_caption p'),
                    visible_link: _text(el, '.b_adurl cite'),
                    tracking_link: _attr(el, 'h2 a', 'href'),
                };

                results.right_side_ads.push(ad_obj);
            });


            let effective_query_el = document.querySelector('#sp_requery a');

            if (effective_query_el) {
                results.effective_query = effective_query_el.innerText;
            }

            return results;
        });

        results.results = this.clean_results(results.results, ['title', 'link']);
        results.ads = this.clean_results(results.ads, ['title', 'visible_link', 'tracking_link']);
        results.time = (new Date()).toUTCString();
        return results;
    }

    async load_start_page() {
        let startUrl = this.build_start_url('https://www.bing.com/search?') || 'https://www.bing.com/';

        if (this.config.bing_settings) {
            startUrl = `https://www.${this.config.bing_settings.bing_domain}/search?`;
            if (this.config.bing_settings.bing_domain) {
                startUrl = `https://www.${this.config.bing_settings.bing_domain}/search?`;
            } else {
                startUrl = `https://www.bing.com/search?`;
            }

            for (var key in this.config.bing_settings) {
                if (key !== 'bing_domain') {
                    startUrl += `${key}=${this.config.bing_settings[key]}&`
                }
            }
        }

        await this.page.goto(startUrl);
        await this.page.waitForSelector('input[name="q"]', { timeout: this.STANDARD_TIMEOUT });
        
        return true;
    }

    async search_keyword(keyword) {
        const input = await this.page.$('input[name="q"]');
        await this.set_input_value(`input[name="q"]`, keyword);
        await this.sleep(50);
        await input.focus();
        await this.page.keyboard.press("Enter");
    }

    async next_page() {
        let next_page_link = await this.page.$('.sb_pagN', {timeout: 1000});
        if (!next_page_link) {
            return false;
        }

        this.last_response = await Promise.all([
            next_page_link.click(), // The promise resolves after navigation has finished
            this.page.waitForNavigation(), // Clicking the link will indirectly cause a navigation
        ]);

        return true;
    }

    async wait_for_results() {
        await this.page.waitForSelector('#b_content', { timeout: this.STANDARD_TIMEOUT });
    }

    async detected() {
        // TODO: I was actually never detected by bing. those are good boys.
    }
}


class BingNewsScraper extends Scraper {

    parse(html) {
        // load the page source into cheerio
        const $ = cheerio.load(html);

        // perform queries
        const results = [];
        $('#algocore .newsitem').each((i, link) => {
            results.push({
                link: $(link).attr('url'),
                title: $(link).find('a.title').text(),
                snippet: $(link).find('.snippet').text(),
                date: $(link).find('.source span').last().text(),
            })
        });

        const cleaned = this.clean_results(results, ['title', 'link']);

        return {
            time: (new Date()).toUTCString(),
            results: cleaned,
        }
    }

    async load_start_page() {
        let startUrl = 'https://www.bing.com/news/search?';

        try {
            await this.page.goto(startUrl);
            if (this.config.set_manual_settings === true) {
                console.log('Sleeping 30 seconds. Set your settings now.');
                await this.sleep(30000);
            }
            await this.page.waitForSelector('input[name="q"]', { timeout: this.STANDARD_TIMEOUT });
        } catch (e) {
            return false;
        }

        return true;
    }

    async search_keyword(keyword) {
        const input = await this.page.$('input[name="q"]');
        await this.set_input_value(`input[name="q"]`, keyword);
        await this.sleep(50);
        await input.focus();
        await this.page.keyboard.press("Enter");
    }

    async next_page() {
        let next_page_link = await this.page.$('.sb_pagN', {timeout: 1000});
        if (!next_page_link) {
            return false;
        }

        this.last_response = await Promise.all([
            next_page_link.click(), // The promise resolves after navigation has finished
            this.page.waitForNavigation(), // Clicking the link will indirectly cause a navigation
        ]);

        return true;
    }

    async wait_for_results() {
        await this.page.waitForSelector('#news', { timeout: this.STANDARD_TIMEOUT });
    }

    async detected() {
        // TODO: I was actually never detected by bing news.
    }
}

module.exports = {
    BingNewsScraper: BingNewsScraper,
    BingScraper: BingScraper,
};
