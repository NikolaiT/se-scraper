const cheerio = require('cheerio');
const Scraper = require('./se_scraper');

class BaiduScraper extends Scraper {
    parse(html) {
        // load the page source into cheerio
        const $ = cheerio.load(html);

        // perform queries
        const results = [];
        $('#content_left .result').each((i, link) => {
            results.push({
                link: $(link).find('h3 a').attr('href'),
                title: $(link).find('h3').text(),
                snippet: $(link).find('.c-abstract').text(),
                visible_link: $(link).find('.f13').text(),
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

        return {
            time: (new Date()).toUTCString(),
            no_results: false,
            num_results: $('.nums_text').text(),
            results: cleaned,
        }
    }

    async load_start_page() {

        let startUrl = this.build_start_url('https://www.baidu.com/s?') || 'https://www.baidu.com/';

        try {
            await this.page.goto(startUrl);
            await this.page.waitForSelector('input[name="wd"]', { timeout: 5000 });
        } catch (e) {
            return false;
        }
        return true;
    }

    async search_keyword(keyword) {
        const input = await this.page.$('input[name="wd"]');
        await this.set_input_value(`input[name="wd"]`, keyword);
        await this.sleep(50);
        await input.focus();
        await this.page.keyboard.press("Enter");
    }

    async next_page() {
        let next_page_link = await this.page.$('#page .n', {timeout: 5000});
        if (!next_page_link) {
            return false;
        }
        await next_page_link.click();

        return true;
    }

    async wait_for_results() {
        await this.page.waitForSelector('#content_left .result', { timeout: 5000 });
    }

    async detected() {
    }
}

module.exports = {
    BaiduScraper: BaiduScraper,
};