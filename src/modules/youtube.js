const cheerio = require('cheerio');
const sfunctions = require('./functions.js');

module.exports = {
	scrape_youtube_pup: scrape_youtube_pup,
};

const all_videos = new Set();

async function scrape_youtube_pup(page, event, context, pluggable) {
	await page.goto('https://www.youtube.com');

	try {
		await page.waitForSelector('input[id="search"]', { timeout: 5000 });
	} catch (e) {
		return results;
	}

	let keywords = event.keywords;
	var results = {};

    // before we do anything, parse the results of the front page of youtube
    await page.waitForSelector('ytd-video-renderer,ytd-grid-video-renderer', { timeout: 10000 });
    await sfunctions.sleep(500);

    let html = await page.content();
    results['__frontpage__'] = parse(html);

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
			const input = await page.$('input[id="search"]');
			// overwrites last text in input
			await input.click({ clickCount: 3 });
			await input.type(keyword);
			await input.focus();
			await page.keyboard.press("Enter");

            if (event.sleep_range) {
                await sfunctions.random_sleep(event);
            }

            await page.waitForFunction(`document.title.indexOf('${keyword}') !== -1`, { timeout: 5000 });
            await page.waitForSelector('ytd-video-renderer,ytd-grid-video-renderer', { timeout: 5000 });
            await sfunctions.sleep(500);

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

	let no_results = sfunctions.no_results(
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
			res.rank = i+1;

			// check if this result has been used before
			if (all_videos.has(res.title) === false) {
                cleaned.push(res);
			}
            all_videos.add(res.title);
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