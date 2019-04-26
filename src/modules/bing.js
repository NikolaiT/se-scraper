const cheerio = require('cheerio');
const Scraper = require('./se_scraper');

class BingScraper extends Scraper {

    parse(html) {
        // load the page source into cheerio
        const $ = cheerio.load(html);

        // perform queries
        const results = [];
        $('#b_content #b_results .b_algo').each((i, link) => {
            results.push({
                link: $(link).find('h2 a').attr('href'),
                title: $(link).find('h2').text(),
                snippet: $(link).find('.b_caption p').text(),
                visible_link: $(link).find('cite').text(),
            })
        });

        // 'Including results for', 'Einschließlich Ergebnisse'
        let no_results = this.no_results(
            ['There are no results', 'Es gibt keine Ergebnisse'],
            $('#b_results').text()
        );

        let effective_query = $('#sp_requery a').first().text() || '';

        const cleaned = [];
        for (var i=0; i < results.length; i++) {
            let res = results[i];
            if (res.link && res.link.trim() && res.title && res.title.trim()) {
                res.rank = this.result_rank++;
                cleaned.push(res);
            }
        }

        return {
            time: (new Date()).toUTCString(),
            no_results: no_results,
            effective_query: effective_query,
            num_results: $('#b_content .sb_count').text(),
            results: cleaned,
        }
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

        try {
            await this.page.goto(startUrl);
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

        const cleaned = [];
        for (var i=0; i < results.length; i++) {
            let res = results[i];
            if (res.link && res.link.trim() && res.title && res.title.trim()) {
                res.rank = this.result_rank++;
                cleaned.push(res);
            }
        }

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
