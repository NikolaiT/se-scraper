const cheerio = require('cheerio');
const Scraper = require('./se_scraper');

class GoogleScraper extends Scraper {

	parse(html) {
		// load the page source into cheerio
		const $ = cheerio.load(html);

		// perform queries
		const results = [];
		$('#center_col .g').each((i, link) => {
			results.push({
				link: $(link).find('.r a').attr('href'),
				title: $(link).find('.r a').text(),
				snippet: $(link).find('span.st').text(),
				visible_link: $(link).find('.r cite').text(),
				date: $(link).find('span.f').text() || '',
			})
		});

		let no_results = this.no_results(
			['Es wurden keine mit deiner Suchanfrage', 'did not match any documents', 'Keine Ergebnisse für',
				'No results found for', 'Ergebnisse für', 'Showing results for'],
			$('#main').text()
		);

		let effective_query = $('#fprsl').text() || '';
		if (!effective_query) {
			effective_query = $('#fprs a').text()
		}

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
			num_results: $('#resultStats').text(),
			no_results: no_results,
			effective_query: effective_query,
			results: cleaned
		}
	}

	async load_start_page() {
		await this.page.goto('https://www.google.com/');

		try {
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
		let next_page_link = await this.page.$('#pnnext', {timeout: 1000});
		if (!next_page_link) {
			return false;
		}
		await next_page_link.click();
		await this.page.waitForNavigation();

		return true;
	}

	async wait_for_results() {
		await this.page.waitForSelector('#center_col', { timeout: this.STANDARD_TIMEOUT });
		await this.sleep(500);
	}

	async detected() {
		const title = await this.page.title();
		let html = await this.page.content();
		return html.indexOf('detected unusual traffic') !== -1 || title.indexOf('/sorry/') !== -1;
	}
}

class GoogleNewsOldScraper extends Scraper {

	parse(html) {
		const $ = cheerio.load(html);
		// perform queries
		const results = [];

		$('.g').each((i, result) => {
			results.push({
				link: $(result).find('h3 a').attr('href'),
				title: $(result).find('h3 a').text(),
				snippet: $(result).find('.st').text(),
				date: $(result).find('.nsa').text(),
			})
		});

		let no_results = this.no_results(
			['Es wurden keine mit deiner Suchanfrage', 'did not match any documents', 'Keine Ergebnisse für',
				'No results found for', 'Ergebnisse für', 'Showing results for', 'did not match any news results'],
			$('#main').text()
		);

		let effective_query = $('#fprsl').text() || '';
		if (!effective_query) {
			effective_query = $('#fprs a').text()
		}

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
			results: cleaned,
			no_results: no_results,
			effective_query: effective_query,
		}
	}

	async load_start_page() {
		return true;
	}

	async search_keyword(keyword) {
		await this.page.goto(`https://www.google.com/search?q=${keyword}&hl=en&source=lnms&tbm=nws`, {
			referer: 'https://www.google.com/'
		});
		await this.page.waitForSelector('input[name="q"]', { timeout: this.STANDARD_TIMEOUT });
	}

	async next_page() {
		let next_page_link = await this.page.$('#pnnext', {timeout: 1000});
		if (!next_page_link) {
			return false;
		}
		await next_page_link.click();
		await this.page.waitForNavigation();

		return true;
	}

	async wait_for_results() {
		//await this.page.waitForNavigation({ timeout: this.STANDARD_TIMEOUT });
		await this.page.waitForSelector('#main', { timeout: this.STANDARD_TIMEOUT });
		await this.sleep(500);
	}

	async detected() {
		const title = await this.page.title();
		let html = await this.page.content();
		return html.indexOf('detected unusual traffic') !== -1 || title.indexOf('/sorry/') !== -1;
	}
}


class GoogleImageScraper extends Scraper {

	parse(html) {
		// load the page source into cheerio
		const $ = cheerio.load(html);

		// perform queries
		const results = [];
		$('.rg_bx').each((i, link) => {
			let link_element = $(link).find('a.rg_l').attr('href');
			let clean_link = clean_image_url(link_element);
			results.push({
				link: link_element,
				clean_link: clean_link,
				snippet: $(link).find('.a-no-hover-decoration').text(),
			})
		});

		let no_results = this.no_results(
			['stimmt mit keinem Bildergebnis', 'Keine Ergebnisse für', 'not match any image results', 'No results found for',
				'Showing results for', 'Ergebnisse für'],
			$('#main').text()
		);

		let effective_query = $('#fprsl').text() || '';
		if (!effective_query) {
			effective_query = $('#fprs a').text();
		}

		const cleaned = [];
		for (var i=0; i < results.length; i++) {
			let res = results[i];
			if (res.link && res.link.trim() && res.link.trim().length > 10) {
				res.link = res.link.trim();
				res.rank = this.result_rank++;
				cleaned.push(res);
			}
		}

		return {
			time: (new Date()).toUTCString(),
			no_results: no_results,
			results: cleaned,
			effective_query: effective_query
		}
	}

	async load_start_page() {
		try {
			await this.page.goto(`https://www.google.com/imghp?tbm=isch`, {
				referer: 'https://www.google.com/'
			});
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
		let next_page_link = await this.page.$('#pnnext', {timeout: 1000});
		if (!next_page_link) {
			return false;
		}
		await next_page_link.click();
		await this.page.waitForNavigation();

		return true;
	}

	async wait_for_results() {
		await this.page.waitForSelector('#main', { timeout: this.STANDARD_TIMEOUT });
		await this.sleep(500);
	}

	async detected() {
		const title = await this.page.title();
		let html = await this.page.content();
		return html.indexOf('detected unusual traffic') !== -1 || title.indexOf('/sorry/') !== -1;
	}
}


class GoogleNewsScraper extends Scraper {

	parse(html) {
		const $ = cheerio.load(html);
		// perform queries
		const results = [];

		$('article h3').each((i, headline) => {

			let title = $(headline).find('a span').text();

			try {
				var snippet = $(headline).parent().find('p').text();
				var link = $(headline).find('a').attr('href');
				var date = $(headline).parent().parent().parent().find('time').text();
				var ts = $(headline).parent().parent().parent().find('time').attr('datetime');
			} catch(e) {

			}

			if (!this.all_results.has(title)) {
				results.push({
					rank: i+1,
					title: title,
					snippet: snippet,
					link: link,
					date: date,
					ts: ts,
				});
			}
			this.all_results.add(title);
		});

		let no_results = this.no_results(
			['Es wurden keine mit deiner Suchanfrage', 'did not match any documents', 'Keine Ergebnisse für',
				'No results found for', 'Ergebnisse für', 'Showing results for', 'did not match any news results'],
			$('body').text()
		);

		let effective_query = $('#fprsl').text() || '';

		const cleaned = [];
		for (var i=0; i < results.length; i++) {
			let res = results[i];
			if (res.title && res.title.trim()) {
				res.rank = this.result_rank++;
				cleaned.push(res);
			}
		}

		return {
			time: (new Date()).toUTCString(),
			results: cleaned,
			no_results: no_results,
			effective_query: effective_query,
		}
	}

	async load_start_page() {
		try {
			this.all_results = new Set();
			await this.page.goto(`https://news.google.com/?hl=en-US&gl=US&ceid=US:en`, {
				referer: 'https://news.google.com'
			});
			await this.page.waitForSelector('div input:nth-child(2)', {timeout: this.STANDARD_TIMEOUT});
			await this.sleep(1000);

			// parse here front page results
			let html = await this.page.content();
			this.results['frontpage'] = this.parse(html);
			this.result_rank = 1;
		} catch(e) {
			return false;
		}
		return true;
	}

	async search_keyword(keyword) {
		await this.page.waitForSelector('div input:nth-child(2)', { timeout: this.STANDARD_TIMEOUT });
		const input = await this.page.$('div input:nth-child(2)');
		// overwrites last text in input
		await input.click({ clickCount: 3 });
		await input.type(keyword);
		await this.sleep(50);
		await input.focus();
		await this.page.keyboard.press("Enter");
	}

	async next_page() {
		// google news app does not have next pages
		return false;
	}

	async wait_for_results() {
		await this.page.waitForSelector(`[data-n-q="${this.keyword}"]`, { timeout: this.STANDARD_TIMEOUT });
		await this.sleep(2000);
	}

	async detected() {
		const title = await this.page.title();
		let html = await this.page.content();
		return html.indexOf('detected unusual traffic') !== -1 || title.indexOf('/sorry/') !== -1;
	}
}

function clean_image_url(url) {
	// Example:
	// https://www.google.com/imgres?imgurl=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2Fthumb%2Ff%2Ffd%2F1928_Edward_Campbell.jpg%2F220px-1928_Edward_Campbell.jpg&imgrefurl=https%3A%2F%2Fwww.revolvy.com%2Fpage%2FSir-Edward-Campbell%252C-1st-Baronet&docid=BMkW_GerTIY4GM&tbnid=TmQapIxDCQbQhM%3A&vet=10ahUKEwje_LLE_YXeAhXisaQKHVAEBSAQMwiNAShEMEQ..i&w=220&h=290&bih=1696&biw=1280&q=John%20MacLeod%20Breadalbane%20Councillor%20Prince%20Edward%20Island&ved=0ahUKEwje_LLE_YXeAhXisaQKHVAEBSAQMwiNAShEMEQ&iact=mrc&uact=8
	const regex = /imgurl=(.*?)&/gm;
	let match = regex.exec(url);
	if (match !== null) {
		return decodeURIComponent(match[1]);
	}
}

function clean_google_url(url) {
	// Example:
	// /url?q=https://www.zeit.de/thema/donald-trump&sa=U&ved=0ahUKEwiL9-u-_ZLgAhVJsqQKHeITDAoQFgg0MAc&usg=AOvVaw3JV3UZjTXRwaS2I-sBbeXF
	// /search?q=trump&hl=de&gbv=2&ie=UTF-8&prmd=ivns&source=univ&tbm=nws&tbo=u&sa=X&ved=0ahUKEwiL9-u-_ZLgAhVJsqQKHeITDAoQqAIIFA
	const regex = /url\?q=(.*?)&/gm;
	let match = regex.exec(url);
	if (match !== null) {
		return decodeURIComponent(match[1]);
	} else {
		return url;
	}
}

module.exports = {
	GoogleNewsOldScraper: GoogleNewsOldScraper,
	GoogleScraper: GoogleScraper,
	GoogleImageScraper: GoogleImageScraper,
	GoogleNewsScraper: GoogleNewsScraper,
};