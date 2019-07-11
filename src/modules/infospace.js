const cheerio = require('cheerio');
const Scraper = require('./se_scraper');

class InfospaceScraper extends Scraper {

    parse(html) {
        // load the page source into cheerio
        const $ = cheerio.load(html);

        // perform queries
        const results = [];
        $('.result').each((i, link) => {
            results.push({
                link: $(link).find('a.title').attr('href'),
                title: $(link).find('a.title').text(),
                snippet: $(link).find('.description').text(),
                visible_link: $(link).find('.url').text(),
            })
        });

        const cleaned = [];
        for (var i=0; i < results.length; i++) {
            let res = results[i];
            if (res.link && res.link.trim()) {
                res.rank = this.result_rank++;
                cleaned.push(res);
            }
        }

        let no_results = this.no_results(
            ['No search results were found for'],
            $('.layout__mainline').text()
        );

        return {
            time: (new Date()).toUTCString(),
            no_results: no_results,
            num_results: '',
            results: cleaned,
        }
    }

    async load_start_page() {

        let startUrl = this.build_start_url('http://search.infospace.com/search/web?') || 'http://infospace.com/index.html';

        try {
            this.last_response = await this.page.goto(startUrl);
            await this.page.waitForSelector('input[name="q"]', { timeout: 5000 });
        } catch (e) {
            return false;
        }
        return true;
    }

    async search_keyword(keyword) {
        const input = await this.page.$('input[id="q"]');
        await this.set_input_value('input[id="q"]', keyword);
        await this.sleep(50);
        await input.focus();
        await this.page.keyboard.press("Enter");
    }

    async next_page() {
        let next_page_link = await this.page.$('a.next', {timeout: 1000});
        if (!next_page_link) {
            return false;
        }
        await next_page_link.click();
        this.last_response = await this.page.waitForNavigation();

        return true;
    }

    async wait_for_results() {
        await this.page.waitForSelector('.mainline-results', { timeout: 5000 }); // TODO: this is not the best selector.
    }

    async detected() {
    }
}

class WebcrawlerNewsScraper extends Scraper {

    parse(html) {
        // load the page source into cheerio
        const $ = cheerio.load(html);

        // perform queries
        const results = [];
        $('.article').each((i, link) => {
            let source = $(link).find('.source').text();
            let date = source.split(',')[1] || '';
            results.push({
                link: $(link).find('a').attr('href'),
                title: $(link).find('.title').text(),
                publisher: $(link).find('.source').text(),
                date: date,
                snippet: $(link).find('.description').text(),
            });
        });

        const cleaned = this.clean_results(results, ['title', 'link']);

        return {
            time: (new Date()).toUTCString(),
            results: cleaned
        }
    }

    async load_start_page() {
        try {
            this.last_response = await this.page.goto('https://www.webcrawler.com/?qc=news');
            await this.page.waitForSelector('input[name="q"]', { timeout: 5000 });
        } catch (e) {
            return false;
        }
        return true;
    }

    async search_keyword(keyword) {
        const input = await this.page.$('input[name="q"]');
        await this.set_input_value('input[name="q"]', keyword);
        await this.sleep(50);
        await input.focus();
        await this.page.keyboard.press("Enter");
    }

    async next_page() {
        let next_page_link = await this.page.$('.pagination__num--next', {timeout: 1000});
        if (!next_page_link) {
            return false;
        }
        await next_page_link.click();
        await this.page.waitForNavigation();

        return true;
    }

    async wait_for_results() {
        await this.page.waitForSelector('.mainline-results', { timeout: 5000 });
    }

    async detected() {
    }
}

module.exports = {
    InfospaceScraper: InfospaceScraper,
    WebcrawlerNewsScraper: WebcrawlerNewsScraper,
};