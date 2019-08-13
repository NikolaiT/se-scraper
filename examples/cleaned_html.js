const se_scraper = require('./../index.js');
const fs = require('fs');

(async () => {

	let kw = 'news iran'

    let scrape_job = {
        search_engine: 'baidu',
        keywords: [kw],
        num_pages: 1,
        html_output: true,
        // whether to strip JS and CSS from the html_output
        // has only an effect if `html_output` is true
        clean_html_output: true,
        // remove all data images from the html
        clean_data_images: true,
    };

    var response = await se_scraper.scrape({}, scrape_job);

    console.dir(response, {depth: null, colors: true});

    fs.writeFileSync('example_cleaned.html', response.results[kw]['1']['html']);
})();
