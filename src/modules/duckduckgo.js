const cheerio = require('cheerio');
const Scraper = require('./se_scraper');
const debug = require('debug')('se-scraper:DuckduckgoScraper');

class DuckduckgoScraper extends Scraper {

    parse(html) {
        debug('parse');
        // load the page source into cheerio
        const $ = cheerio.load(html);

        // perform queries
        const results = [];
        const organicSelector = ($('#links .result--sep').length > 0) ? `#links #rld-${this.page_num - 1} ~ .result .result__body` : '#links .result__body';
        $(organicSelector).each((i, link) => {
            results.push({
                link: $(link).find('.result__title .result__a').attr('href'),
                title: $(link).find('.result__title .result__a').text(),
                date: $(link).find('.result__timestamp').text(),
                snippet: $(link).find('.result__snippet').text(),
                visible_link: $(link).find('.result__url').attr('href'),
            });
        });

        const ads = [];
        $('.results--ads .result').each((i, element) => {
            ads.push({
                visible_link: $(element).find('.result__url').text(),
                tracking_link: $(element).find('.result__title .result__a').attr('href'),
                title: $(element).find('.result__title .result__a').text(),
                snippet: $(element).find('.result__snippet').text(),
            })
        });

        let effective_query = $('a.js-spelling-suggestion-link').attr('data-query') || '';

        const cleaned = this.clean_results(results, ['title', 'link']);

        return {
            time: (new Date()).toUTCString(),
            effective_query: effective_query,
            results: cleaned,
            ads: ads,
        }
    }

    async load_start_page() {
        debug('load_start_page');
        this.last_response = await this.page.goto(this.startUrl);
        await this.page.waitForSelector('input[name="q"]', { timeout: this.STANDARD_TIMEOUT });
        return true;
    }

    async search_keyword(keyword) {
        debug('search_keyword');
        const input = await this.page.$('input[name="q"]');
        await this.set_input_value(`input[name="q"]`, keyword);
        await this.sleep(50);
        await input.focus();
        await this.page.keyboard.press("Enter");
    }

    async next_page() {
        debug('next_page');
        let next_page_link = await this.page.$('.result.result--more a', {timeout: this.STANDARD_TIMEOUT});
        if (!next_page_link) {
            return false;
        }
        await next_page_link.click();
        await this.page.waitForNavigation({ timeout: this.STANDARD_TIMEOUT });

        return true;
    }

    async wait_for_results() {
        debug('wait_for_results');
        await this.page.waitForSelector('.result__body', { timeout: this.STANDARD_TIMEOUT });
    }

    async detected() {
    }
}

module.exports = {
    DuckduckgoScraper: DuckduckgoScraper,
};