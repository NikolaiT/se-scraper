const se_scraper =  require('./../../index.js');
const chai = require('chai');
chai.use(require('chai-string'));
const assert = chai.assert;
const path = require('path');

async function normal_search_test() {
    let config = {
        compress: false,
        debug_level: 1,
        headless: true,
    };

    let scrape_config = {
        search_engine: 'google',
        keywords: ['rückspiegel schwarz'],
        num_pages: 1,
        scrape_from_file: 'file://' + path.join(__dirname, './html/google.html'),
    };

    google_search_with_products( await se_scraper.scrape(config, scrape_config) );

    scrape_config.scrape_from_file = 'file://' + path.join(__dirname, './html/google2.html');
    scrape_config.keywords = ['autoreifen mercedes c-klasse'];

    google_search_with_products2( await se_scraper.scrape(config, scrape_config) );

    scrape_config.scrape_from_file = 'file://' + path.join(__dirname, './html/google3.html');
    scrape_config.keywords = ['kaffeemaschine kaufen'];

    google_places( await se_scraper.scrape(config, scrape_config) );
}

// we test with a callback function to our handler
function google_search_with_products(response) {
    assert.equal(response.metadata.num_requests, 1);

    for (let query in response.results) {

        for (let page_number in response.results[query]) {

            assert.isNumber(parseInt(page_number), 'page_number must be numeric');

            let obj = response.results[query][page_number];

            assert.include(obj.num_results, '1’780’000', 'num results not included');
            assert.containsAllKeys(obj, ['results', 'time', 'no_results', 'num_results', 'effective_query', 'top_ads', 'bottom_ads', 'places'], 'not all keys are in the object');
            assert.isAtLeast(obj.results.length, 9, 'results must have at least 8 SERP objects');
            assert.isAtLeast(obj.top_ads.length, 0, 'there are no top ads');
            assert.isAtLeast(obj.bottom_ads.length, 3, 'there are 3 bottom ads');
            assert.isAtLeast(obj.top_products.length, 15, 'there are 15 top products');
            assert.equal(obj.right_products.length, 0, 'there are 0 right products');

            assert.equal(obj.no_results, false, 'no results should be false');
            assert.typeOf(obj.num_results, 'string', 'num_results must be a string');
            assert.isAtLeast(obj.num_results.length, 5, 'num_results should be a string of at least 5 chars');
            assert.typeOf(Date.parse(obj.time), 'number', 'time should be a valid date');

            confirm_results_ok(obj);

        }
    }
}


function google_search_with_products2(response) {
    assert.equal(response.metadata.num_requests, 1);

    for (let query in response.results) {

        for (let page_number in response.results[query]) {

            assert.isNumber(parseInt(page_number), 'page_number must be numeric');

            let obj = response.results[query][page_number];

            assert.include(obj.num_results, '437’000 Ergebnisse (0.41 Sekunden)', 'num results not included');
            assert.containsAllKeys(obj, ['results', 'time', 'no_results', 'num_results', 'effective_query', 'top_ads', 'bottom_ads', 'places'], 'not all keys are in the object');
            assert.isAtLeast(obj.results.length, 9, 'results must have at least 8 SERP objects');
            assert.isAtLeast(obj.top_ads.length, 0, 'there are no top ads');
            assert.isAtLeast(obj.bottom_ads.length, 1, 'there are 1 bottom ads');
            assert.isAtLeast(obj.top_products.length, 0, 'there are 0 top products');
            assert.equal(obj.right_products.length, 4, 'there are 4 right products');

            assert.equal(obj.no_results, false, 'no results should be false');
            assert.typeOf(obj.num_results, 'string', 'num_results must be a string');
            assert.isAtLeast(obj.num_results.length, 5, 'num_results should be a string of at least 5 chars');
            assert.typeOf(Date.parse(obj.time), 'number', 'time should be a valid date');

            confirm_results_ok(obj);

        }
    }
}

function google_places(response) {
    assert.equal(response.metadata.num_requests, 1);

    for (let query in response.results) {

        for (let page_number in response.results[query]) {

            assert.isNumber(parseInt(page_number), 'page_number must be numeric');

            let obj = response.results[query][page_number];

            assert.include(obj.num_results, '6’750’000 Ergebnisse (0.52 Sekunden)', 'num results not included');
            assert.containsAllKeys(obj, ['results', 'time', 'no_results', 'num_results', 'effective_query', 'top_ads', 'bottom_ads', 'places'], 'not all keys are in the object');
            assert.isAtLeast(obj.results.length, 10, 'results must have at least 9 SERP objects');
            assert.equal(obj.top_ads.length, 0, 'there are no top ads');
            assert.equal(obj.bottom_ads.length, 0, 'there are 0 bottom ads');
            assert.equal(obj.top_products.length, 0, 'there are 0 top products');
            assert.equal(obj.right_products.length, 0, 'there are 0 right products');
            assert.equal(obj.places.length, 3, 'there are 3 places');

            assert.equal(obj.no_results, false, 'no results should be false');
            assert.typeOf(obj.num_results, 'string', 'num_results must be a string');
            assert.isAtLeast(obj.num_results.length, 5, 'num_results should be a string of at least 5 chars');
            assert.typeOf(Date.parse(obj.time), 'number', 'time should be a valid date');

            confirm_results_ok(obj);
        }
    }
}


function confirm_results_ok(obj) {

    for (let res of obj.results) {
        assert.containsAllKeys(res, ['link', 'title', 'rank', 'visible_link', 'snippet'], 'not all keys are in the SERP object');

        assert.isOk(res.link, 'link must be ok');
        assert.typeOf(res.link, 'string', 'link must be string');
        assert.isAtLeast(res.link.length, 5, 'link must have at least 5 chars');

        assert.isOk(res.visible_link, 'visible_link must be ok');
        assert.typeOf(res.visible_link, 'string', 'visible_link must be string');
        assert.isAtLeast(res.visible_link.length, 5, 'visible_link must have at least 5 chars');

        assert.isOk(res.title, 'title must be ok');
        assert.typeOf(res.title, 'string', 'title must be string');
        assert.isAtLeast(res.title.length, 10, 'title must have at least 10 chars');

        assert.isOk(res.snippet, 'snippet must be ok');
        assert.typeOf(res.snippet, 'string', 'snippet must be string');
        assert.isAtLeast(res.snippet.length, 10, 'snippet must have at least 10 chars');

        assert.isNumber(res.rank, 'rank must be integer');
    }

    for (let res of obj.top_ads) {

        assert.isOk(res.tracking_link, 'link must be ok');
        assert.typeOf(res.tracking_link, 'string', 'link must be string');
        assert.isAtLeast(res.tracking_link.length, 5, 'link must have at least 5 chars');

        assert.isOk(res.visible_link, 'link must be ok');
        assert.typeOf(res.visible_link, 'string', 'link must be string');
        assert.isAtLeast(res.visible_link.length, 5, 'link must have at least 5 chars');

        assert.isOk(res.link, 'visible_link must be ok');
        assert.typeOf(res.link, 'string', 'visible_link must be string');
        assert.isAtLeast(res.link.length, 5, 'visible_link must have at least 5 chars');

        assert.isOk(res.title, 'title must be ok');
        assert.typeOf(res.title, 'string', 'title must be string');
        assert.isAtLeast(res.title.length, 10, 'title must have at least 10 chars');

        assert.isOk(res.snippet, 'snippet must be ok');
        assert.typeOf(res.snippet, 'string', 'snippet must be string');
        assert.isAtLeast(res.snippet.length, 10, 'snippet must have at least 10 chars');

        assert.typeOf(res.links, 'array', 'links must be array');
    }

    for (let res of obj.bottom_ads) {
        assert.isOk(res.tracking_link, 'link must be ok');
        assert.typeOf(res.tracking_link, 'string', 'link must be string');
        assert.isAtLeast(res.tracking_link.length, 5, 'link must have at least 5 chars');

        assert.isOk(res.visible_link, 'link must be ok');
        assert.typeOf(res.visible_link, 'string', 'link must be string');
        assert.isAtLeast(res.visible_link.length, 5, 'link must have at least 5 chars');

        assert.isOk(res.link, 'visible_link must be ok');
        assert.typeOf(res.link, 'string', 'visible_link must be string');
        assert.isAtLeast(res.link.length, 5, 'visible_link must have at least 5 chars');

        assert.isOk(res.title, 'title must be ok');
        assert.typeOf(res.title, 'string', 'title must be string');
        assert.isAtLeast(res.title.length, 10, 'title must have at least 10 chars');

        assert.isOk(res.snippet, 'snippet must be ok');
        assert.typeOf(res.snippet, 'string', 'snippet must be string');
        assert.isAtLeast(res.snippet.length, 10, 'snippet must have at least 10 chars');

        assert.typeOf(res.links, 'array', 'links must be array');
    }

    for (let res of obj.top_products) {

        assert.isOk(res.tracking_link, 'link must be ok');
        assert.typeOf(res.tracking_link, 'string', 'link must be string');
        assert.isAtLeast(res.tracking_link.length, 5, 'link must have at least 5 chars');

        assert.isOk(res.link, 'link must be ok');
        assert.typeOf(res.link, 'string', 'link must be string');
        assert.isAtLeast(res.link.length, 5, 'link must have at least 5 chars');

        assert.isOk(res.price, 'price must be ok');
        assert.typeOf(res.price, 'string', 'price must be string');
        assert.isAtLeast(res.price.length, 5, 'price must have at least 5 chars');

        assert.isOk(res.title, 'title must be ok');
        assert.typeOf(res.title, 'string', 'title must be string');
        assert.isAtLeast(res.title.length, 10, 'title must have at least 10 chars');

        assert.isOk(res.vendor_link, 'vendor_link must be ok');
        assert.typeOf(res.vendor_link, 'string', 'vendor_link must be string');
        assert.isAtLeast(res.vendor_link.length, 10, 'vendor_link must have at least 10 chars');
    }

    for (let res of obj.right_products) {
        assert.isOk(res.tracking_link, 'link must be ok');
        assert.typeOf(res.tracking_link, 'string', 'link must be string');
        assert.isAtLeast(res.tracking_link.length, 5, 'link must have at least 5 chars');

        assert.isOk(res.link, 'link must be ok');
        assert.typeOf(res.link, 'string', 'link must be string');
        assert.isAtLeast(res.link.length, 5, 'link must have at least 5 chars');

        assert.isOk(res.price, 'price must be ok');
        assert.typeOf(res.price, 'string', 'price must be string');
        assert.isAtLeast(res.price.length, 5, 'price must have at least 5 chars');

        assert.isOk(res.title, 'title must be ok');
        assert.typeOf(res.title, 'string', 'title must be string');
        assert.isAtLeast(res.title.length, 10, 'title must have at least 10 chars');

        assert.isOk(res.vendor_link, 'vendor_link must be ok');
        assert.typeOf(res.vendor_link, 'string', 'vendor_link must be string');
        assert.isAtLeast(res.vendor_link.length, 10, 'vendor_link must have at least 10 chars');
    }

    for (let res of obj.places) {
        assert.isOk(res.heading, 'heading must be ok');
        assert.typeOf(res.heading, 'string', 'heading must be string');
        assert.isAtLeast(res.heading.length, 5, 'heading must have at least 5 chars');

        assert.isOk(res.rating, 'rating must be ok');
        assert.typeOf(res.rating, 'string', 'rating must be string');
        assert.isAtLeast(res.rating.length, 5, 'rating must have at least 5 chars');

        assert.isOk(res.contact, 'contact must be ok');
        assert.typeOf(res.contact, 'string', 'contact must be string');
        assert.isAtLeast(res.contact.length, 5, 'contact must have at least 5 chars');

        assert.typeOf(res.hours, 'string', 'hours must be string');
        if (res.hours) {
            assert.isAtLeast(res.hours.length, 10, 'hours must have at least 10 chars');
        }
    }
}

describe('Google', function(){
    this.timeout(10000);
    it('static google searches with products,ads and places',  normal_search_test);
});