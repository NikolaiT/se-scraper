const cheerio = require('cheerio');
const Scraper = require('./se_scraper');

class YoutubeScraper extends Scraper {

	parse(html) {
		// load the page source into cheerio
		const $ = cheerio.load(html);

		// perform queries
		const results = [];
		$('#contents ytd-video-renderer,#contents ytd-grid-video-renderer').each((i, link) => {
			results.push({
				link: $(link).find('#video-title').attr('href'),
				title: $(link).find('#video-title').text(),
				snippet: $(link).find('#description-text').text(),
				channel: $(link).find('#byline a').text(),
				channel_link: $(link).find('#byline a').attr('href'),
				num_views: $(link).find('#metadata-line span:nth-child(1)').text(),
				release_date: $(link).find('#metadata-line span:nth-child(2)').text(),
			})
		});

		let no_results = this.no_results(
			['No results found', 'Keine Ergebnisse', 'Es werden Ergebnisse angezeigt', 'Showing results for' ],
			$('yt-showing-results-for-renderer').text()
		);

		let effective_query = $('#corrected-link').text() || '';

		const cleaned = [];
		for (var i=0; i < results.length; i++) {
			let res = results[i];
			if (res.link && res.link.trim() && res.title && res.title.trim()) {
				res.title = res.title.trim();
				res.snippet = res.snippet.trim();
				res.rank = this.result_rank++;

				// check if this result has been used before
				if (this.all_videos.has(res.title) === false) {
					cleaned.push(res);
				}
				this.all_videos.add(res.title);
			}
		}

		return {
			time: (new Date()).toUTCString(),
			no_results: no_results,
			effective_query: effective_query,
			num_results: '',
			results: cleaned,
		}
	}

	async load_start_page() {
		try {
			this.all_videos = new Set();
			await this.page.goto('https://www.youtube.com', {
				referer: 'https://google.com'
			});
			await this.page.waitForSelector('input[id="search"]', { timeout: 5000 });
			// before we do anything, parse the results of the front page of youtube
			await this.page.waitForSelector('ytd-video-renderer,ytd-grid-video-renderer', { timeout: 10000 });
			await this.sleep(500);
			let html = await this.page.content();
			this.results['frontpage'] = this.parse(html);
			this.result_rank = 1;
		} catch(e) {
			return false;
		}
		return true;
	}

	async search_keyword(keyword) {
		const input = await this.page.$('input[id="search"]');
		// overwrites last text in input
		await input.click({ clickCount: 3 });
		await input.type(keyword);
		await input.focus();
		await this.page.keyboard.press("Enter");
	}

	async next_page() {
		// youtube needs scrolling
		// TODO: implement scrolling, no priority right now
		return false;
	}

	async wait_for_results() {
		await this.page.waitForFunction(`document.title.indexOf('${this.keyword}') !== -1`, { timeout: 5000 });
		await this.page.waitForSelector('ytd-video-renderer,ytd-grid-video-renderer', { timeout: 5000 });
		await this.sleep(500);
	}

	async detected() {
		const title = await this.page.title();
		let html = await this.page.content();
		return html.indexOf('detected unusual traffic') !== -1 || title.indexOf('/sorry/') !== -1;
	}
}

module.exports = {
	YoutubeScraper: YoutubeScraper,
};