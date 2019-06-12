const cheerio = require('cheerio');
const Scraper = require('./se_scraper');

class DuckduckgoScraper extends Scraper {

    parse(html) {
        // load the page source into cheerio
        const $ = cheerio.load(html);

        // perform queries
        const results = [];
        $('.result__body').each((i, link) => {
            results.push({
                link: $(link).find('.result__title .result__a').attr('href'),
                title: $(link).find('.result__title .result__a').text(),
                date: $(link).find('.result__timestamp').text(),
                snippet: $(link).find('.result__snippet').text(),
                visible_link: $(link).find('.result__url').attr('href'),
            });
        });

        let effective_query = $('a.js-spelling-suggestion-link').attr('data-query') || '';

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
            effective_query: effective_query,
            results: cleaned
        }
    }

    async load_start_page() {

        let startUrl = this.build_start_url('https://duckduckgo.com/?') || 'https://duckduckgo.com/';

        try {
            await this.page.goto(startUrl);
            await this.page.waitForSelector('input[name="q"]', { timeout: 5000 });
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
        let next_page_link = await this.page.$('a.result--more__btn', {timeout: 5000});
        if (!next_page_link) {
            return false;
        }
        await next_page_link.click();
        await this.page.waitForNavigation();

        return true;
    }

    async wait_for_results() {
        await this.page.waitForSelector('.result__body', { timeout: 5000 });
    }

    async detected() {
    }
}


class DuckduckgoNewsScraper extends Scraper {

    parse(html) {
        // load the page source into cheerio
        const $ = cheerio.load(html);

        // perform queries
        const results = [];
        $('.result--news').each((i, link) => {
            results.push({
                link: $(link).find('.result__title .result__a').attr('href'),
                title: $(link).find('.result__title .result__a').text(),
                date: $(link).find('.result__timestamp').text(),
                snippet: $(link).find('.result__snippet').text(),
            });
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
            results: cleaned
        }
    }

    async load_start_page() {
        try {
            await this.page.goto('https://duckduckgo.com/?q=42&t=h_&iar=news&ia=news');
            await this.page.waitForSelector('input[name="q"]', { timeout: 5000 });
        } catch (e) {
            console.error(e);
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
        await next_page_link.click();
        await this.page.waitForNavigation();

        return true;
    }

    async wait_for_results() {
        await this.page.waitForSelector('.result--news', { timeout: 5000 });
    }

    async detected() {
    }
}

module.exports = {
    DuckduckgoNewsScraper: DuckduckgoNewsScraper,
    DuckduckgoScraper: DuckduckgoScraper,
};