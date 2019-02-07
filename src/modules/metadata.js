const cheerio = require('cheerio');

module.exports = {
	get_ip_data: get_ip_data,
	get_http_headers: get_http_headers,
};

async function get_ip_data(browser) {
	const page = await browser.newPage();
	await page.goto('https://ipinfo.io/json', {
	  waitLoad: true, 
	  waitNetworkIdle: true // defaults to false
	});
	let json = await page.content({
		timeout: 20000
	});
	const $ = cheerio.load(json);
	let ipinfo_text =  $('pre').text();
	return JSON.parse(ipinfo_text);
}

async function get_http_headers(browser) {
	const page = await browser.newPage();
	await page.goto('https://httpbin.org/get', {
	  waitLoad: true, 
	  waitNetworkIdle: true // defaults to false
	});
	let headers = await page.content();

	const $ = cheerio.load(headers);
	let headers_text =  $('pre').text();
	return JSON.parse(headers_text);
}