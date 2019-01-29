const cheerio = require('cheerio');
const sfunctions = require('./functions.js');

module.exports = {
	scrape_baidu_pup: scrape_baidu_pup,
};

async function scrape_baidu_pup(page, event, context, pluggable) {
	await page.goto('https://www.baidu.com/');

	try {
		await page.waitForSelector('input[name="wd"]', { timeout: 5000 });
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
			const input = await page.$('input[name="wd"]');
			// overwrites last text in input
			await input.click({ clickCount: 3 });
			await input.type(keyword);
			await input.focus();
			await page.keyboard.press("Enter");

            if (event.sleep_range) {
                await sfunctions.random_sleep(event);
            }

			// in baidu we have a issue with waiting for a selector 
			// or waiting for navigation
			// therefore, we just manually sleep

			// issue in baidu: https://github.com/GoogleChrome/puppeteer/issues/609
			// https://github.com/GoogleChrome/puppeteer/issues/2671
			// await page.evaluate( () => {
			//     if ( ! window.Node ) {
			//         window.Node = {};
			//     }
			//     if ( ! Node.ELEMENT_NODE ) {
			//         Node.ELEMENT_NODE = 1;
			//     }
			// } );
			// await page.waitForSelector('.result', { timeout: 5000 });

			// this should be reasonable for normal internet connections
			await sfunctions.sleep(2000);

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
			res.rank = i+1;
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