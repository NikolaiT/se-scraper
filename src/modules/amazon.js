const cheerio = require('cheerio');
const Scraper = require('./se_scraper');

class AmazonScraper extends Scraper {

    constructor(...args) {
        super(...args);
    }

    parse(html) {
        // load the page source into cheerio
        const $ = cheerio.load(html);

        // perform queries
        const results = [];
        $('#search .s-result-item').each((i, product) => {
            results.push({
                image: $(product).find('[data-component-type="s-product-image"] a').attr('href'),
                seller: $(product).find('h5 + div span').text(),
                link: $(product).find('h5 a').attr('href'),
                title: $(product).find('h5 a span').text(),
                stars: $(product).find('a i span').text(),
                num_reviews: $(product).find('span > a > span:first-child').text(),
                price: $(product).find('.a-price .a-offscreen').text(),
                oldprice: $(product).find('.a-price[data-a-color="secondary"]').text(),
            })
        });

        let no_results = this.no_results(
            ['Keine Ergebnisse', 'No results for '],
            $('#search').text()
        );

        let effective_query = $('[data-component-type="s-result-info-bar"] span.a-text-bold').text() || '';

        const cleaned = [];
        for (var i=0; i < results.length; i++) {
            let res = results[i];
            if (res.link && res.link.trim() && res.title && res.title.trim() && res.price && res.price.trim() && res.stars.trim()) {
                res.rank = this.result_rank++;
                cleaned.push(res);
            }
        }

        return {
            time: (new Date()).toUTCString(),
            num_results: $('[data-component-type="s-result-info-bar"] .a-spacing-top-small').text(),
            no_results: no_results,
            effective_query: effective_query,
            results: cleaned
        }
    }

    async load_start_page() {
        let startUrl = 'https://www.amazon.com/';

        if (this.config.amazon_settings) {
            startUrl = `https://www.${this.config.amazon_settings.amazon_domain}/s?`;
            if (this.config.amazon_settings.amazon_domain) {
                startUrl = `https://www.${this.config.amazon_settings.amazon_domain}/s?`;
            } else {
                startUrl = 'https://www.amazon.com/s?';
            }

            for (var key in this.config.amazon_settings) {
                if (key !== 'amazon_domain') {
                    startUrl += `${key}=${this.config.amazon_settings[key]}&`
                }
            }
        }

        if (this.config.verbose) {
            console.log('Using startUrl: ' + startUrl);
        }

        await this.page.goto(startUrl);

        try {
            await this.page.waitForSelector('input[name="field-keywords"]', { timeout: this.STANDARD_TIMEOUT });
        } catch (e) {
            return false;
        }

        return true;
    }

    async search_keyword(keyword) {
        const input = await this.page.$('input[name="field-keywords"]');
        await this.set_input_value(`input[name="field-keywords"]`, keyword);
        await this.sleep(50);
        await input.focus();
        await this.page.keyboard.press("Enter");
    }

    async next_page() {
        let next_page_link = await this.page.$('.a-last a', {timeout: 1000});
        if (!next_page_link) {
            return false;
        }
        await next_page_link.click();

        return true;
    }

    async wait_for_results() {
        await this.page.waitForSelector('.s-result-list', { timeout: this.STANDARD_TIMEOUT });
        await this.sleep(500);
    }

    async detected() {
        const title = await this.page.title();
        let html = await this.page.content();
        return html.indexOf('detected unusual traffic') !== -1 || title.indexOf('/sorry/') !== -1;
    }
}


module.exports = {
    AmazonScraper: AmazonScraper,
};