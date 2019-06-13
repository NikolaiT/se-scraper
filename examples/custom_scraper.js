const se_scraper = require('./../index.js');

/*
 * This example shows how you can define your custom scraper class and use it
 * within se-scraper.
 */
class EcosiaScraper extends se_scraper.Scraper {

    constructor(...args) {
        super(...args);
    }

    async parse_async(html) {
        // In this example we use vanilla javascript to parse out the
        // interesting information from the search engine

        // you may also use a external library such as cheerio.

        return await this.page.evaluate(() => {
           var results = {
               num_results: '',
               no_results: false,
               effective_query: '',
               results: [],
           };

           document.querySelectorAll('.results .result').forEach((result) => {
              var serp = {};
              var title =  result.querySelector('.result-title');
              if (title) {
                  serp.title = title.innerText;
                  serp.link = title.getAttribute('href');
              }

              var green = result.querySelector('.result-url');
              if (green) {
                  serp.green = green.getAttribute('href');
              }

              var snippet = result.querySelector('.result-snippet');

              if (snippet) {
                  serp.snippet = snippet.innerText;
              }

              results.results.push(serp);
           });

           var num_res = document.querySelector('.card-title-result-count');
           if (num_res) {
               results.num_results = num_res.innerText;
           }

           results.no_results = document.querySelector('.empty-result') != null;

           var effective = document.querySelector('.query-context-text .result-title');

           if (effective) {
               results.effective_query = effective.innerText;
           }

           return results;
        });
    }

    async load_start_page() {
        let startUrl = 'https://www.ecosia.org/';

        await this.page.goto(startUrl);

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
        let next_page_link = await this.page.$('.pagination-next', {timeout: 1000});
        if (!next_page_link) {
            return false;
        }
        await next_page_link.click();

        return true;
    }

    async wait_for_results() {
        await this.page.waitForSelector('.results .result', { timeout: this.STANDARD_TIMEOUT });
    }

    async detected() {
        // check whether scraping was detected.
    }
}

(async () => {

    let scrape_job = {
        search_engine: EcosiaScraper,
        keywords: ['lets go boys'],
        num_pages: 2,
    };

    var results = await se_scraper.scrape({headless: true}, scrape_job);

    console.dir(results, {depth: null, colors: true});

})();
