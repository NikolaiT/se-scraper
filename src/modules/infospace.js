const cheerio = require('cheerio');
const sfunctions = require('./functions.js');

module.exports = {
	scrape_infospace_pup: scrape_infospace_pup,
    scrape_webcrawler_news_pup: scrape_webcrawler_news_pup,
};

async function scrape_infospace_pup(page, event, context, pluggable) {
	await page.goto('http://infospace.com/index.html');

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
			const input = await page.$('input[id="q"]');
			// overwrites last text in input
			await input.click({ clickCount: 3 });
			await input.type(keyword);
			await input.focus();
			await page.keyboard.press("Enter");

            if (event.sleep_range) {
                await sfunctions.random_sleep(event);
            }

			await page.waitForSelector('.mainline-results', { timeout: 5000 }); // TODO: this is not the best selector.
			await sfunctions.sleep(250);
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
			res.rank = i+1;
			cleaned.push(res);
		}
	}

    let no_results = sfunctions.no_results(
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

async function scrape_webcrawler_news_pup(page, event, context, pluggable) {
    await page.goto('https://www.webcrawler.com/?qc=news');

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
            await sfunctions.sleep(150);
            await input.type(keyword);
            await sfunctions.sleep(150);
            await input.focus();
            await page.keyboard.press("Enter");

            if (event.sleep_range) {
                await sfunctions.random_sleep(event);
            }

            await page.waitForSelector('.mainline-results', { timeout: 5000 });

            if (event.debug === true && event.is_local === true) {
                await page.screenshot({path: `debug/${keyword}.png`});
            }
            let html = await page.content();
            results[keyword] = parse_webcrawler_news_results(html, event.max_results);

        } catch (e) {
            console.error(`Problem with scraping ${keyword}: ${e}`);
            return results;
        }
    }
    return results;
}

function parse_webcrawler_news_results(html) {
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
        results: cleaned
    }
}