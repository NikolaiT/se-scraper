const se_scraper = require('../index.js');

async function multiple_search_engines() {

    var searchEnginesList = ['google', 'bing'];

    for (let index = 0; index < searchEnginesList.length; index++) {
        const searchEngine = searchEnginesList[index];
        let config = {
            random_user_agent: true,
            write_meta_data: true,
            sleep_range: '[1,1]',
            search_engine: searchEngine,
            debug: false,
            verbose: false,
            // the list of keywords to scrape
            keywords: ['scrapeulous.com',],
            // whether to start the browser in headless mode
            headless: true,
            output_file: `${searchEngine}.json`
        };

        await se_scraper.scrape(config, (err, response) => {
            if (err) {
                console.error(err)
            }
            console.dir(response.results, {
                depth: null,
                colors: true
            });
        });
    }
}

multiple_search_engines();