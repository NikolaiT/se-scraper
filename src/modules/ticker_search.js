const cheerio = require('cheerio');
const Scraper = require('./se_scraper');

class YahooFinanceScraper extends Scraper {

    parse(html) {
        // load the page source into cheerio
        const $ = cheerio.load(html);

        const results = [];
        $('.js-stream-content .Cf').each((i, link) => {
            results.push({
                link: $(link).find('h3 a').attr('href'),
                title: $(link).find('h3').text(),
                snippet: $(link).find('p').text(),
            })
        });

        return {
            time: (new Date()).toUTCString(),
            results: results,
        }
    }

    async load_start_page() {
        try {
            await this.page.goto('https://finance.yahoo.com/');
            for (var i = 0; i < 3; i++) {
                let consent = await this.page.waitForSelector('[type="submit"]');
                await consent.click();
            }
        } catch (e) {
            return false;
        }
        return true;
    }

    async search_keyword(keyword) {
        await this.page.goto(`https://finance.yahoo.com/quote/${keyword}/news?p=${keyword}`);
        await this.page.waitForSelector('#quote-header-info', { timeout: 8000 });
    }

    async next_page() {
        return false;
    }

    async wait_for_results() {
        await this.page.waitForSelector('#b_content', { timeout: 5000 });
    }

    async detected() {
    }
}

class MarketwatchFinanceScraper extends Scraper {

    async parse_async(html) {
        let res = await this.page.evaluate(() => {
            let results = [];
            // get the hotel elements
            let items = document.querySelectorAll('.article__content');
            // get the hotel data
            items.forEach((newsitem) => {
                let data = {};
                try {
                    data.link = newsitem.querySelector('.article__headline a').getAttribute('href');
                    data.title = newsitem.querySelector('.article__headline a').innerText;
                    data.date = newsitem.querySelector('.article__timestamp').innerText;
                    data.author = newsitem.querySelector('.article__author').innerText;
                }
                catch (exception) {
                    console.error('Error parsing marketwatch data: ', exception);
                }
                results.push(data);
            });
            return results;
        });

        return {
            time: (new Date()).toUTCString(),
            results: res,
        }
    }

    async load_start_page() {
        return true;
    }

    async search_keyword(keyword) {
        await this.page.goto(`https://www.marketwatch.com/investing/stock/${keyword}`);
    }

    async next_page() {
        return false;
    }

    async wait_for_results() {
        await this.page.waitForSelector('.intraday__data', { timeout: 8000 });
    }

    async detected() {
    }
}

class ReutersFinanceScraper extends Scraper {

    async parse_async(html) {
        let newsData = await this.page.evaluate(() => {
            let results = [];
            // get the hotel elements
            let items = document.querySelectorAll('div.feature');
            // get the hotel data
            items.forEach((newsitem) => {
                let data = {};
                try {
                    data.link = newsitem.querySelector('h2 a').getAttribute('href');
                    data.link = 'https://www.reuters.com' + data.link;
                    data.title = newsitem.querySelector('h2 a').innerText;
                    data.snippet = newsitem.querySelector('p').innerText;
                    data.date = newsitem.querySelector('.timestamp').innerText;
                }
                catch (exception) {
                    console.error('Error parsing reuters data: ', exception);
                }
                results.push(data);
            });
            return results;
        });

        return {
            time: (new Date()).toUTCString(),
            results: newsData,
        }
    }

    async load_start_page() {
        return true;
    }

    async search_keyword(keyword) {
        await this.page.goto(`https://www.reuters.com/finance/stocks/overview/${keyword}`);
    }

    async next_page() {
        return false;
    }

    async wait_for_results() {
        await this.page.waitForSelector('#sectionHeader', { timeout: 8000 });
    }

    async detected() {
    }
}

class CnbcFinanceScraper extends Scraper {

    async parse_async(html) {
        let newsData = await this.page.evaluate(() => {
            let results = [];
            // get the hotel elements
            let items = document.querySelectorAll('div.headline');
            // get the hotel data
            items.forEach((newsitem) => {
                let data = {};
                try {
                    data.link = newsitem.querySelector('a').getAttribute('href');
                    data.title = newsitem.querySelector('[ng-bind="asset.headline"]').innerText;
                    data.date = newsitem.querySelector('span.note').innerText;
                }
                catch (exception) {
                    console.error('Error parsing cnbc data: ', exception);
                }
                results.push(data);
            });
            return results;
        });

        return {
            time: (new Date()).toUTCString(),
            results: newsData,
        }
    }

    async load_start_page() {
        return true;
    }

    async search_keyword(keyword) {
        await this.page.goto(`https://www.cnbc.com/quotes/?symbol=${keyword}&tab=news`);
    }

    async next_page() {
        return false;
    }

    async wait_for_results() {
        await this.page.waitForSelector('#quote_title_and_chart', { timeout: 8000 });
    }

    async detected() {
    }
}

module.exports = {
    YahooFinanceScraper: YahooFinanceScraper,
    ReutersFinanceScraper: ReutersFinanceScraper,
    CnbcFinanceScraper: CnbcFinanceScraper,
    MarketwatchFinanceScraper: MarketwatchFinanceScraper,
};