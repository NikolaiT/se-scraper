const cheerio = require('cheerio');
const sfunctions = require('./functions.js');
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

		let no_results = sfunctions.no_results(
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
				res.rank = i+1;
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


async function scrape_google_pup_dr(page, event, context, pluggable) {
    let keywords = event.keywords;
    first = keywords[0];
    var year = first.slice(-5);
    var remaining = first.slice(0,-5);
    year = parseInt(year.trim());
    let dr_from = `1/1/${year-1}`;
    let dr_to = `1/1/${year+1}`;
    var url = `https://www.google.com/search?lr=&hl=en&tbs=cdr:1,cd_min:${dr_from},cd_max:${dr_to}&q=${remaining}&oq=${remaining}`;

    await page.goto(url);

    try {
        await page.waitForSelector('input[name="q"]', { timeout: STANDARD_TIMEOUT });
    } catch (e) {
        return results;
    }

    var results = {};

    for (var i = 1; i < keywords.length; i++) {

        // strip the year at the end plus whitespace
        keyword = keywords[i].slice(0,-5);

		if (pluggable.before_keyword_scraped) {
			await pluggable.before_keyword_scraped({
				keyword: keyword,
				page: page,
				event: event,
				context: context,
			});
		}

        if (event.verbose === true) {
            console.log(`${event.search_engine} is scraping keyword: ${keyword}`);
        }

        try {
            const input = await page.$('input[name="q"]');
            // overwrites last text in input
            // await input.click({ clickCount: 3 });
            // await sfunctions.sleep(50);
            // await input.type(keyword);
            await sfunctions.set_input_value(page, `input[name="q"]`, keyword);
            await sfunctions.sleep(50);

            await input.focus();
            await page.keyboard.press("Enter");

            if (event.debug === true && event.is_local === true) {
                console.log(`[${i}] Scraping ${keyword}`);
            }

            if (event.sleep_range) {
                await sfunctions.random_sleep(event);
            }

            await page.waitForSelector('#center_col', { timeout: STANDARD_TIMEOUT });
            await sfunctions.sleep(100);

        } catch (e) {
            console.error(`Problem with scraping ${keyword}: ${e}`);

            if (await scraping_detected(page) === true) {
                console.error('Google detected the scraping. Aborting.');

                if (event.is_local === true) {
                    await sfunctions.sleep(SOLVE_CAPTCHA_TIME);
                    console.error('You have 45 seconds to enter the captcha.');
                    // expect that user filled out necessary captcha
                } else {
                    return results;
				}
            } else {
                // some other error, quit scraping process if stuff is broken
                if (event.is_local === true) {
                    console.error('You have 30 seconds to fix this.');
                    await sfunctions.sleep(30000);
                } else {
                    return results;
                }
            }
        }

        let html = await page.content();
        results[keyword] = parse_google_results(html);
        results[keyword].daterange = dr_from + '-' + dr_to;
        results[keyword].year = year;
    }

    return results;
}

function parse_google_results(html) {
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

	let no_results = sfunctions.no_results(
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
			res.rank = i+1;
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

async function scraping_detected(page) {
    const title = await page.title();
    let html = await page.content();
	return html.indexOf('detected unusual traffic') !== -1 || title.indexOf('/sorry/') !== -1;
}

async function scrape_google_news_old_pup(page, event, context, pluggable) {
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

        if (event.verbose === true) {
            console.log(`${event.search_engine} is scraping keyword: ${keyword}`);
        }

		try {
			await page.goto(`https://www.google.com/search?q=${keyword}&hl=en&source=lnms&tbm=nws`, {
	  			referer: 'https://www.google.com/'
			});
			await page.waitForSelector('input[name="q"]', { timeout: STANDARD_TIMEOUT });
			const input = await page.$('input[name="q"]');
			// overwrites last text in input
			// await input.click({ clickCount: 3 });
			// await input.type(keyword);
            await sfunctions.set_input_value(page, `input[name="q"]`, keyword);
            await sfunctions.sleep(50);
			await input.focus();
			await page.keyboard.press("Enter");

            if (event.sleep_range) {
                await sfunctions.random_sleep(event);
            }

			await page.waitForNavigation({ timeout: STANDARD_TIMEOUT });
			await page.waitForSelector('#main', { timeout: STANDARD_TIMEOUT });

			await sfunctions.sleep(200);

		} catch(e) {
			console.error(`Problem with scraping ${keyword}: ${e}`);

            if (await scraping_detected(page) === true) {
                console.error('Google detected the scraping. Aborting.');

                if (event.is_local === true) {
                    await sfunctions.sleep(SOLVE_CAPTCHA_TIME);
                    console.error('You have 45 seconds to enter the captcha.');
                    // expect that user filled out necessary captcha
                } else {
                    return results;
                }
            } else {
                // some other error, quit scraping process if stuff is broken
                if (event.is_local === true) {
                    console.error('You have 30 seconds to fix this.');
                    await sfunctions.sleep(30000);
                } else {
                    return results;
                }
            }
		}

        let html = await page.content();
        results[keyword] = parse_google_news_results_se_format(html);

	}

	return results;
}

function parse_google_news_results_se_format(html) {
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

	let no_results = sfunctions.no_results(
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
			res.rank = i+1;
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

async function scrape_google_image_pup(page, event, context, pluggable) {
	let keywords = event.keywords;
	var results = {};

	await page.goto(`https://www.google.com/imghp?tbm=isch`, {
			referer: 'https://www.google.com/'
	});

	try {
		await page.waitForSelector('input[name="q"]', { timeout: STANDARD_TIMEOUT });
	} catch (e) {
		return results;
	}

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

        if (event.verbose === true) {
            console.log(`${event.search_engine} is scraping keyword: ${keyword}`);
        }

		try {
			const input = await page.$('input[name="q"]');
			// overwrites last text in input
			// await input.click({ clickCount: 3 });
			// await input.type(keyword);
            await sfunctions.set_input_value(page, `input[name="q"]`, keyword);
            await sfunctions.sleep(50);

			await input.focus();
			await page.keyboard.press("Enter");

            if (event.sleep_range) {
                await sfunctions.random_sleep(event);
            }

			await page.waitForNavigation({ timeout: STANDARD_TIMEOUT});
			await page.waitForSelector('#main', { timeout: STANDARD_TIMEOUT });

			let html = await page.content();
			results[keyword] = parse_google_image_results(html);
		} catch (e) {
			console.error(`Problem with scraping ${keyword}: ${e}`);

            if (await scraping_detected(page) === true) {
                console.error('Google detected the scraping. Aborting.');

                if (event.is_local === true) {
                    await sfunctions.sleep(SOLVE_CAPTCHA_TIME);
                    console.error('You have 45 seconds to enter the captcha.');
                    // expect that user filled out necessary captcha
                } else {
                    return results;
                }
            } else {
                // some other error, quit scraping process if stuff is broken
                if (event.is_local === true) {
                    console.error('You have 30 seconds to fix this.');
                    await sfunctions.sleep(30000);
                } else {
                    return results;
                }
            }
		}

	}

	return results;
}

function parse_google_image_results(html) {
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

	let no_results = sfunctions.no_results(
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
			res.rank = i+1;
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

const all_results = new Set();

async function scrape_google_news_pup(page, event, context, pluggable) {
	let keywords = event.keywords;
	var results = {};

	await page.goto(`https://news.google.com/?hl=en-US&gl=US&ceid=US:en`, {
			referer: 'https://news.google.com'
	});
	await page.waitForSelector('div input:nth-child(2)', { timeout: STANDARD_TIMEOUT });
	await sfunctions.sleep(1000);

	// parse here front page results
	let html = await page.content();
	results['frontpage'] = parse_google_news_results(html);

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

        if (event.verbose === true) {
            console.log(`${event.search_engine} is scraping keyword: ${keyword}`);
        }

		try {
			await page.waitForSelector('div input:nth-child(2)', { timeout: STANDARD_TIMEOUT });

			const input = await page.$('div input:nth-child(2)');
			// overwrites last text in input
			await input.click({ clickCount: 3 });
			await input.type(keyword);
			// TODO: setting the input in https://news.google.com/
			// TODO: doesn't work. Fall back to use clicking and typing
            // await setTextInputValue(page, `input[aria-label="Search"]`, keyword);
            await sfunctions.sleep(50);
			await input.focus();
			await page.keyboard.press("Enter");

            if (event.sleep_range) {
                await sfunctions.random_sleep(event);
            }

			//await page.waitForSelector('#main', { timeout: 5000 });

			await sfunctions.sleep(2500);

			html = await page.content();
			results[keyword] = parse_google_news_results(html);

		} catch(e) {
			console.error(`Problem with scraping ${keyword}: ${e}`);

            if (await scraping_detected(page) === true) {
                console.error('Google detected the scraping. Aborting.');

                if (event.is_local === true) {
                    await sfunctions.sleep(SOLVE_CAPTCHA_TIME);
                    console.error('You have 45 seconds to enter the captcha.');
                    // expect that user filled out necessary captcha
                } else {
                    return results;
                }
            } else {
                // some other error, quit scraping process if stuff is broken
                if (event.is_local === true) {
                    console.error('You have 30 seconds to fix this.');
                    await sfunctions.sleep(30000);
                } else {
                    return results;
                }
            }
		}
	}

	return results;
}

function parse_google_news_results(html) {
	const $ = cheerio.load(html);
	// perform queries
	const results = [];

	$('article h3').each((i, headline) => {

		title = $(headline).find('a span').text();

		try {
			snippet = $(headline).parent().find('p').text();
            link = $(headline).find('a').attr('href');
			date = $(headline).parent().parent().parent().find('time').text();
			ts = $(headline).parent().parent().parent().find('time').attr('datetime');
		} catch(e) {

		}

		if (!all_results.has(title)) {
		    results.push({
		      rank: i+1,
		      title: title,
		      snippet: snippet,
              link: link,
		      date: date,
		      ts: ts,
		    })
		}
		all_results.add(title);
	});

	let no_results = sfunctions.no_results(
		['Es wurden keine mit deiner Suchanfrage', 'did not match any documents', 'Keine Ergebnisse für',
			'No results found for', 'Ergebnisse für', 'Showing results for', 'did not match any news results'],
		$('body').text()
	);

	let effective_query = $('#fprsl').text() || '';

	const cleaned = [];
	for (var i=0; i < results.length; i++) {
		let res = results[i];
		if (res.title && res.title.trim()) {
			res.rank = i+1;
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


module.exports = {
	scrape_google_news_old_pup: scrape_google_news_old_pup,
	GoogleScraper: GoogleScraper,
	scrape_google_image_pup: scrape_google_image_pup,
	scrape_google_news_pup: scrape_google_news_pup,
	scrape_google_pup_dr: scrape_google_pup_dr,
};