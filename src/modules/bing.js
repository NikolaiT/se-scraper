const cheerio = require('cheerio');
const sfunctions = require('./functions.js');

module.exports = {
	scrape_bing_pup: scrape_bing_pup,
	scrape_bing_news_pup: scrape_bing_news_pup,
};

async function scrape_bing_pup(page, event, context, pluggable) {
	await page.goto('https://www.bing.com/');

	try {
		await page.waitForSelector('input[name="q"]', { timeout: 5000 });
	} catch (e) {
		return results;
	}

	let keywords = event.keywords;
	var results = {};

	for (var i = 0; i < keywords.length; i++) {

		keyword = keywords[i];

		if (pluggable.before_keyword_scraped) {
			await pluggable.before_keyword_scraped({
				keyword: keyword,
				page: page,
				event: event,
				context: context,
			});
		}

		try {
			const input = await page.$('input[name="q"]');
			// overwrites last text in input
			await input.click({ clickCount: 3 });
			await input.type(keyword);
			await input.focus();
			await page.keyboard.press("Enter");

            if (event.sleep_range) {
                await sfunctions.random_sleep(event);
            }

			await page.waitForSelector('#b_content', { timeout: 5000 });
			if (event.debug === true && event.is_local === true) {
				await page.screenshot({path: `debug/${keyword}.png`});
			}

			let html = await page.content();
			results[keyword] = parse(html);

		} catch (e) {
			console.error(`Problem with scraping ${keyword}: ${e}`);
		}
	}

	return results;
}

function parse(html) {
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

	let no_results = sfunctions.no_results(
		['There are no results', 'Es gibt keine Ergebnisse', 'Including results for', 'Einschließlich Ergebnisse'],
		$('#b_results').text()
	);

	let effective_query = $('#sp_requery a').first().text() || '';

	const cleaned = [];
	for (var i=0; i < results.length; i++) {
		let res = results[i];
		if (res.link && res.link.trim() && res.title && res.title.trim()) {
			res.rank = i+1;
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

async function scrape_bing_news_pup(page, event, context, pluggable) {
	await page.goto('https://www.bing.com/news/search?');

	if (event.set_manual_settings === true) {
		console.log('Sleeping 30 seconds. Set your settings now.');
		await sfunctions.sleep(30000);
	}

	try {
		await page.waitForSelector('input[name="q"]', { timeout: 5000 });
	} catch (e) {
		return results;
	}

	let keywords = event.keywords;
	var results = {};

	for (var i = 0; i < keywords.length; i++) {

		keyword = keywords[i];

		if (pluggable.before_keyword_scraped) {
			await pluggable.before_keyword_scraped({
				keyword: keyword,
				page: page,
				event: event,
				context: context,
			});
		}

		try {
			const input = await page.$('input[name="q"]');
			// overwrites last text in input
			await input.click({ clickCount: 3 });
			await input.type(keyword);
			await input.focus();
			await page.keyboard.press("Enter");

            if (event.sleep_range) {
                await sfunctions.random_sleep(event);
            }

			await page.waitForSelector('#news', { timeout: 5000 });
			await sfunctions.sleep(2000);

			if (event.debug === true && event.is_local === true) {
				await page.screenshot({path: `debug/${keyword}.png`});
			}

			let html = await page.content();
			results[keyword] = parse_bing_news(html);

		} catch (e) {
			console.error(`Problem with scraping ${keyword}: ${e}`);
		}
	}

	return results;
}

function parse_bing_news(html) {
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
			res.rank = i+1;
			cleaned.push(res);
		}
	}

	return {
		time: (new Date()).toUTCString(),
		results: cleaned,
	}
}