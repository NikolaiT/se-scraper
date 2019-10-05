const se_scraper = require('./../index.js');

(async () => {

    let kws = [
        'https://www.linkedin.com/in/aakanksha-majhi-b24a8449',
        'https://www.linkedin.com/in/aakash-srivastava-7374a830',
        'https://www.linkedin.com/in/aakash-tiwari-019b8569',
    ];

    let scrape_job = {
        search_engine: 'google',
        keywords: kws,
        num_pages: 1,
    };

    var results = await se_scraper.scrape({}, scrape_job);

    console.dir(results, {depth: null, colors: true});

})();
