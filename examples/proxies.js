const se_scraper = require('./../index.js');

let config = {
    search_engine: 'google',
    debug: false,
    verbose: true,
    keywords: ['news', 'scrapeulous.com', 'incolumitas.com', 'i work too much', 'what to do?', 'javascript is hard'],
    num_pages: 1,
    output_file: 'examples/results/proxyresults.json',
    proxy_file: '/home/nikolai/.proxies', // one proxy per line
    log_ip_address: false,
};

function callback(err, response) {
    if (err) { console.error(err) }
    //console.dir(response, {depth: null, colors: true});
}

se_scraper.scrape(config, callback);