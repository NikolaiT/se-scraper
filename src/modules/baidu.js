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
		try {
			await this.page.goto('https://www.baidu.com/');
			await this.page.waitForSelector('input[name="wd"]', { timeout: 5000 });
		} catch (e) {
			return false;
		}
		return true;
	}

	async search_keyword(keyword) {
		const input = await this.page.$('input[name="wd"]');
		// overwrites last text in input
		await input.click({ clickCount: 3 });
		await input.type(keyword);
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
		// TODO: very very bad, but nobody uses baidu, or does someone?
		await this.sleep(2000);
	}

	async detected() {
	}
}

module.exports = {
	BaiduScraper: BaiduScraper,
};