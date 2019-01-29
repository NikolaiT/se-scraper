const cheerio = require('cheerio');

module.exports = {
	get_metadata: get_metadata,
	get_http_headers: get_http_headers,
};

async function get_metadata(browser) {
	let metadata = {};
	const page = await browser.newPage();
	await page.goto('https://ipinfo.io/json', {
	  waitLoad: true, 
	  waitNetworkIdle: true // defaults to false
	});
	let json = await page.content({
		timeout: 20000
	});
	const $ = cheerio.load(json);
	metadata.ipinfo = $('pre').text();
	return metadata;
}

async function get_http_headers(browser) {
	let metadata = {};
	const page = await browser.newPage();
	await page.goto('https://httpbin.org/get', {
	  waitLoad: true, 
	  waitNetworkIdle: true // defaults to false
	});
	let headers = await page.content();
	return headers;
}