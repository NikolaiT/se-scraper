const se_scraper = require('./../index.js');

(async () => {

    let scrape_job = {
        search_engine: 'google',
        keywords: ['lets go boys'],
        num_pages: 1,
    };

    var results = await se_scraper.scrape({}, scrape_job);

    console.dir(results, {depth: null, colors: true});

})();
