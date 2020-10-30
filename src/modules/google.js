'use strict';

const cheerio = require('cheerio');
const Scraper = require('./se_scraper');

class GoogleScraper extends Scraper {

    constructor(...args) {
        super(...args);
    }

    async parse_async(html) {

        const results = await this.page.evaluate(() => {

            let _text = (el, s) => {
                let n = el.querySelector(s);

                if (n) {
                    return n.innerText;
                } else {
                    return '';
                }
            };

            let _attr = (el, s, attr) => {
                let n = el.querySelector(s);

                if (n) {
                    return n.getAttribute(attr);
                } else {
                    return null;
                }
            };

            let results = {
                num_results: '',
                no_results: false,
                effective_query: '',
                right_info: {},
                results: [],
                top_products: [],
                right_products: [],
                top_ads: [],
                bottom_ads: [],
                places: [],
            };

            let num_results_el = document.getElementById('resultStats');

            if (num_results_el) {
                results.num_results = num_results_el.innerText;
            }

            let organic_results = document.querySelectorAll('#center_col .g');

            organic_results.forEach((el) => {

                let serp_obj = {
                    link: _attr(el, '.rc a', 'href'),
                    title: _text(el, '.rc a h3'),
                    snippet: _text(el, '.rc > div:nth-child(2) span span'),
                    visible_link: _text(el, '.rc cite'),
                    date: _text(el, '.rc > div:nth-child(2) span.f'),
                };

                if (serp_obj.date) {
                    serp_obj.date = serp_obj.date.replace(' - ', '');
                }

                results.results.push(serp_obj);
            });

            // check if no results
            results.no_results = (results.results.length === 0);

            let parseAds = (container, selector) => {
                document.querySelectorAll(selector).forEach((el) => {
                    let ad_obj = {
                        visible_link: _text(el, '.ads-visurl cite'),
                        tracking_link: _attr(el, 'a:first-child', 'href'),
                        link: _attr(el, 'a:nth-child(2)', 'href'),
                        title: _text(el, 'a h3'),
                        snippet: _text(el, '.ads-creative'),
                        links: [],
                    };
                    el.querySelectorAll('ul li a').forEach((node) => {
                        ad_obj.links.push({
                            tracking_link: node.getAttribute('data-arwt'),
                            link: node.getAttribute('href'),
                            title: node.innerText,
                        })
                    });
                    container.push(ad_obj);
                });
            };

            parseAds(results.top_ads, '#tads .ads-ad');
            parseAds(results.bottom_ads, '#tadsb .ads-ad');

            // parse google places
            document.querySelectorAll('.rllt__link').forEach((el) => {
                results.places.push({
                    heading: _text(el, '[role="heading"] span'),
                    rating: _text(el, '.rllt__details div:first-child'),
                    contact: _text(el, '.rllt__details div:nth-child(2)'),
                    hours: _text(el, '.rllt__details div:nth-child(3)'),
                })
            });

            // parse right side product information
            results.right_info.review = _attr(document, '#rhs .cu-container g-review-stars span', 'aria-label');

            let title_el = document.querySelector('#rhs .cu-container g-review-stars');
            if (title_el) {
                results.right_info.review.title = title_el.parentNode.querySelector('div:first-child').innerText;
            }

            let num_reviews_el = document.querySelector('#rhs .cu-container g-review-stars');
            if (num_reviews_el) {
                results.right_info.num_reviews = num_reviews_el.parentNode.querySelector('div:nth-of-type(2)').innerText;
            }

            results.right_info.vendors = [];
            results.right_info.info = _text(document, '#rhs_block > div > div > div > div:nth-child(5) > div > div');

            document.querySelectorAll('#rhs .cu-container .rhsvw > div > div:nth-child(4) > div > div:nth-child(3) > div').forEach((el) => {
                results.right_info.vendors.push({
                    price: _text(el, 'span:nth-of-type(1)'),
                    merchant_name: _text(el, 'span:nth-child(3) a:nth-child(2)'),
                    merchant_ad_link: _attr(el, 'span:nth-child(3) a:first-child', 'href'),
                    merchant_link: _attr(el, 'span:nth-child(3) a:nth-child(2)', 'href'),
                    source_name: _text(el, 'span:nth-child(4) a'),
                    source_link: _attr(el, 'span:nth-child(4) a', 'href'),
                    info: _text(el, 'div span'),
                    shipping: _text(el, 'span:last-child > span'),
                })
            });

            if (!results.right_info.title) {
                results.right_info = {};
            }

            let right_side_info_el = document.getElementById('rhs');

            if (right_side_info_el) {
                let right_side_info_text = right_side_info_el.innerText;

                if (right_side_info_text && right_side_info_text.length > 0) {
                    results.right_side_info_text = right_side_info_text;
                }
            }

            // parse top main column product information
            // #tvcap .pla-unit
            document.querySelectorAll('#tvcap .pla-unit').forEach((el) => {
                let top_product = {
                    tracking_link: _attr(el, '.pla-unit-title a:first-child', 'href'),
                    link: _attr(el, '.pla-unit-title a:nth-child(2)', 'href'),
                    title: _text(el, '.pla-unit-title a:nth-child(2) span'),
                    price: _text(el, '.pla-unit-title + div'),
                    shipping: _text(el, '.pla-extensions-container div:nth-of-type(1)'),
                    vendor_link: _attr(el,'.pla-extensions-container div > a', 'href'),
                };

                let merchant_node = el.querySelector('.pla-unit-title');
                if (merchant_node) {
                    let node = merchant_node.parentNode.querySelector('div > span');
                    if (node) {
                        top_product.merchant_name = node.innerText;
                    }
                }

                results.top_products.push(top_product);
            });

            // parse top right product information
            // #tvcap .pla-unit
            document.querySelectorAll('#rhs_block .pla-unit').forEach((el) => {
                let right_product = {
                    tracking_link: _attr(el, '.pla-unit-title a:first-child', 'href'),
                    link: _attr(el, '.pla-unit-title a:nth-child(2)', 'href'),
                    title: _text(el, '.pla-unit-title a:nth-child(2) span:first-child'),
                    price: _text(el,'.pla-unit-title + div'),
                    shipping: _text(el,'.pla-extensions-container > div'),
                    vendor_link: _text(el,'.pla-extensions-container div > a'),
                    vendor_name: _text(el,'.pla-extensions-container div > a > div'),
                };

                let merchant_node = el.querySelector('.pla-unit-title');
                if (merchant_node) {
                    let node = merchant_node.parentNode.querySelector('div > span:first-child');
                    if (node) {
                        right_product.merchant_name = node.innerText;
                    }
                }

                results.right_products.push(right_product);
            });

            let effective_query_el = document.getElementById('fprsl');

            if (effective_query_el) {

                results.effective_query = effective_query_el.innerText;
                if (!results.effective_query) {
                    let effective_query_el2 = document.querySelector('#fprs a');
                    if (effective_query_el2) {
                        results.effective_query = document.querySelector('#fprs a').innerText;
                    }
                }
            }

            return results;
        });

        // clean some results
        results.top_products = this.clean_results(results.top_products, ['title', 'link']);
        results.right_products = this.clean_results(results.right_products, ['title', 'link']);
        results.results = this.clean_results(results.results, ['title', 'link' , 'snippet']);

        results.time = (new Date()).toUTCString();
        return results;
    }

    async load_start_page() {
        let startUrl = 'https://www.google.com';

        if (this.config.google_settings) {
            startUrl = `https://www.${this.config.google_settings.google_domain}/search?q=`;
            if (this.config.google_settings.google_domain) {
                startUrl = `https://www.${this.config.google_settings.google_domain}/search?`;
            } else {
                startUrl = `https://www.google.com/search?`;
            }

            for (var key in this.config.google_settings) {
                if (key !== 'google_domain') {
                    startUrl += `${key}=${this.config.google_settings[key]}&`
                }
            }
        }

        this.logger.info('Using startUrl: ' + startUrl);

        this.last_response = await this.page.goto(startUrl);

        await this.page.waitForSelector('input[name="q"]', { timeout: this.STANDARD_TIMEOUT });

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

        return true;
    }

    async wait_for_results() {
        await this.page.waitForSelector('#fbar', { timeout: this.STANDARD_TIMEOUT });
    }

    async detected() {
        const title = await this.page.title();
        let html = await this.page.content();
        return html.indexOf('detected unusual traffic') !== -1 || title.indexOf('/sorry/') !== -1;
    }
}

class GoogleNewsOldScraper extends Scraper {

    parse(html) {
        const $ = cheerio.load(html);
        // perform queries
        const results = [];

        $('g-card').each((i, result) => {
            results.push({
                link: $(result).find('a').attr('href'),
                title: $(result).find('a div div:nth-child(2) div:nth-child(2)').text(),
                snippet: $(result).find('a div div:nth-child(2) div:nth-child(3) div:nth-child(1)').text(),
                date: $(result).find('a div div:nth-child(2) div:nth-child(3) div:nth-child(2)').text(),
            })
        });

        let no_results = this.no_results(
            ['Es wurden keine mit deiner Suchanfrage', 'did not match any documents', 'Keine Ergebnisse für',
                'No results found for', 'did not match any news results'],
            $('#main').text()
        );

        let effective_query = $('#fprsl').text() || '';
        if (!effective_query) {
            effective_query = $('#fprs a').text()
        }

        const cleaned = this.clean_results(results, ['link']);

        return {
            time: (new Date()).toUTCString(),
            results: cleaned,
            no_results: no_results,
            effective_query: effective_query,
        }
    }

    async load_start_page() {
        let startUrl = this.build_start_url('https://www.google.com/search?source=lnms&tbm=nws&') || 'https://www.google.com/search?source=lnms&tbm=nws';
        await this.page.goto(startUrl);
        await this.page.waitForSelector('input[name="q"]', { timeout: this.STANDARD_TIMEOUT });
        return true;
    }

    async search_keyword(keyword) {

        let url = this.build_start_url(`https://www.google.com/search?q=${keyword}&source=lnms&tbm=nws&`) ||
                    `https://www.google.com/search?q=${keyword}&hl=en&source=lnms&tbm=nws`;

        this.last_response = await this.page.goto(url, {
            referer: 'https://www.google.com/'
        });

        await this.page.waitForSelector('input[name="q"]', { timeout: this.STANDARD_TIMEOUT });
    }

    async next_page() {
        let next_page_link = await this.page.$('#pnnext', {timeout: 1000});
        if (!next_page_link) {
            return false;
        }
        await next_page_link.click();

        return true;
    }

    async wait_for_results() {
        await this.page.waitForSelector('#rso', { timeout: this.STANDARD_TIMEOUT });
    }

    async detected() {
        const title = await this.page.title();
        let html = await this.page.content();
        return html.indexOf('detected unusual traffic') !== -1 || title.indexOf('/sorry/') !== -1;
    }
}


class GoogleImageScraper extends Scraper {

    parse(html) {
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

        let no_results = this.no_results(
            ['stimmt mit keinem Bildergebnis', 'Keine Ergebnisse für', 'not match any image results', 'No results found for',],
            $('#main').text()
        );

        let effective_query = $('#fprsl').text() || '';
        if (!effective_query) {
            effective_query = $('#fprs a').text();
        }

        const cleaned = this.clean_results(results, ['link']);

        return {
            time: (new Date()).toUTCString(),
            no_results: no_results,
            results: cleaned,
            effective_query: effective_query
        }
    }

    async load_start_page() {
        try {
            this.last_response = await this.page.goto(`https://www.google.com/imghp?tbm=isch`, {
                referer: 'https://www.google.com/'
            });
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
        // this waitForNavigation makes hardcoded sleeps not necessary
        this.last_response = await this.page.waitForNavigation();
    }

    async next_page() {
        return false;
    }

    async wait_for_results() {
        await this.page.waitForSelector('.rg_bx .a-no-hover-decoration div', {timeout: this.STANDARD_TIMEOUT});
    }

    async detected() {
        const title = await this.page.title();
        let html = await this.page.content();
        return html.indexOf('detected unusual traffic') !== -1 || title.indexOf('/sorry/') !== -1;
    }
}


class GoogleNewsScraper extends Scraper {

    parse(html) {
        const $ = cheerio.load(html);
        // perform queries
        const results = [];

        $('article > h3').each((i, headline) => {

            let title = $(headline).find('a').text();

            try {
                var snippet = $(headline).parent().find('p').text();
                var link = $(headline).find('a').attr('href');
                var date = $(headline).parent().parent().parent().find('time').text();
                var ts = $(headline).parent().parent().parent().find('time').attr('datetime');
            } catch(e) {

            }

            if (!this.all_results.has(title)) {
                results.push({
                    rank: i+1,
                    title: title,
                    snippet: snippet,
                    link: link,
                    date: date,
                    ts: ts,
                });
            }
            this.all_results.add(title);
        });

        let no_results = this.no_results(
            ['Es wurden keine mit deiner Suchanfrage', 'did not match any documents', 'Keine Ergebnisse für',
                'No results found for', 'did not match any news results'],
            $('body').text()
        );

        let effective_query = $('#fprsl').text() || '';

        const cleaned = this.clean_results(results, ['title',]);

        return {
            time: (new Date()).toUTCString(),
            results: cleaned,
            no_results: no_results,
            effective_query: effective_query,
        }
    }

    async load_start_page() {
        try {
            this.all_results = new Set();
            this.last_response = await this.page.goto(`https://news.google.com/?hl=en-US&gl=US&ceid=US:en`, {
                referer: 'https://news.google.com'
            });

            await this.page.waitForSelector('div input:nth-child(2)', {timeout: this.STANDARD_TIMEOUT});
            await this.sleep(1000);

            // parse here front page results
            let html = await this.page.content();
            this.results['frontpage'] = this.parse(html);
            this.result_rank = 1;
        } catch(e) {
            return false;
        }
        return true;
    }

    async search_keyword(keyword) {
        await this.page.waitForSelector('div input:nth-child(2)', { timeout: this.STANDARD_TIMEOUT });
        const input = await this.page.$('div input:nth-child(2)');
        // overwrites last text in input
        await input.click({ clickCount: 3 });
        await input.type(keyword);
        await this.sleep(50);
        await input.focus();
        await this.page.keyboard.press("Enter");
    }

    async next_page() {
        // google news app does not have next pages
        return false;
    }

    async wait_for_results() {
        await this.page.waitForSelector(`[data-n-q="${this.keyword}"]`, { timeout: this.STANDARD_TIMEOUT });
        await this.sleep(1000);
        // TODO: fix googlenewsscraper
        // let nodes = await this.page.evaluate(() => {
        //     var res = [];
        //     document.querySelectorAll('article > h3').forEach((node) => {
        //         try {
        //             let title = node.querySelector('a span').innerHTML;
        //             var snippet = node.querySelector('p').innerHTML;
        //             var link = node.querySelector('a').getAttribute('href');
        //             res.push({
        //                 title: tile,
        //                 snippet: snippet,
        //                 link: link
        //             });
        //         } catch(e) {
        //         }
        //     return res;
        //     });
        // });
    }

    async detected() {
        const title = await this.page.title();
        let html = await this.page.content();
        return html.indexOf('detected unusual traffic') !== -1 || title.indexOf('/sorry/') !== -1;
    }
}


class GoogleMapsScraper extends Scraper {

    constructor(...args) {
        super(...args);
    }

    async parse_async(html) {
        let results = await this.page.evaluate(() => {
            var res = [];
            document.querySelectorAll('.section-listbox-root .section-result').forEach((node) => {
                try {
                    let score = node.querySelector('.cards-rating-score').innerHTML;
                    let num_ratings = node.querySelector('.section-result-num-ratings').innerHTML;
                    let type = node.querySelector('.section-result-details').innerHTML;
                    let title = node.querySelector('.section-result-title span').innerHTML;
                    let location = node.querySelector('.section-result-location').innerHTML;
                    let opening_hours = node.querySelector('.section-result-opening-hours').innerHTML;
                    res.push({
                        node: node,
                        title: title,
                        location: location,
                        score: score,
                        num_ratings: num_ratings,
                        type: type,
                        opening_hours: opening_hours,
                    });
                } catch(e) {
                }
            });
            return res;
        });

        if (this.scrape_in_detail) {
            let profiles = await this.page.$$('.section-listbox-root .section-result');
            console.log(`Profiles to visit: ${profiles.length}`);
            for (var profile of profiles) {
                try {
                    let additional_info = await this.visit_profile(profile);
                    console.log(additional_info);
                } catch(e) {
                    console.error(e);
                }
                profiles = await this.page.$$('.section-listbox-root .section-result');
            }
        }

        return {
            time: (new Date()).toUTCString(),
            results: results
        }
    }

    /*
    https://stackoverflow.com/questions/55815376/puppeteer-open-a-page-get-the-data-go-back-to-the-previous-page-enter-a-new
     */
    async visit_profile(profile) {
        await profile.click();
        await this.page.waitForFunction('document.querySelectorAll(".section-info-line .section-info-text").length > 0', {timeout: 5000});

        let results = await this.page.evaluate(() => {
            let res = [];
            document.querySelectorAll('.section-info-line .section-info-text .widget-pane-link').forEach((node) => {
                try {
                    let info = node.innerHTML.trim();
                    if (info) {
                        res.push(info);
                    }
                } catch(e) {
                }
            });
            return res;
        });

        let back_button = await this.page.$('.section-back-to-list-button', {timeout: 10000});
        if (back_button) {
            await back_button.click();
        }
        return results;
    }

    async load_start_page() {
        let startUrl = 'https://www.google.com/maps';

        if (this.config.google_maps_settings) {
            // whether to visit each result and get all available information
            // including customer reviews
            this.scrape_in_detail = this.config.google_maps_settings.scrape_in_detail || false;
        }

        this.logger.info('Using startUrl: ' + startUrl);

        this.last_response = await this.page.goto(startUrl);

        try {
            await this.page.waitForSelector('#searchbox input[name="q"]', { timeout: this.STANDARD_TIMEOUT });
        } catch (e) {
            return false;
        }

        return true;
    }

    async search_keyword(keyword) {
        const input = await this.page.$('#searchbox input[name="q"]');
        await this.set_input_value(`#searchbox input[name="q"]`, keyword);
        await this.sleep(50);
        await input.focus();
        await this.page.keyboard.press("Enter");
    }

    // TODO: i cannot find a next page link right now
    async next_page() {
        // let s = "//span[substring(@class,string-length(@class) -string-length('__button-next-icon') +1) = '__button-next-icon']";
        // const [next_page_link] = await this.page.$x(s, {timeout: 2000});

        let next_page_link = await this.page.$('[jsaction="pane.paginationSection.nextPage"] span', {timeout: 10000});
        if (!next_page_link) {
            return false;
        }
        await next_page_link.click();

        // because google maps loads all location results dynamically, its hard to check when
        // results have been updated
        // as a quick hack, we will wait until the last title of the last search
        // differs from the last result in the dom

        let last_title_last_result = this.results[this.keyword][this.page_num-1].results.slice(-1)[0].title;

        this.logger.info(`Waiting until new last serp title differs from: "${last_title_last_result}"`);

        await this.page.waitForFunction((last_title) => {
            const res = document.querySelectorAll('.section-result .section-result-title span');
            return res[res.length-1].innerHTML !== last_title;
        }, {timeout: 7000}, this.results[this.keyword][this.page_num-1].results.slice(-1)[0].title);

        return true;
    }

    async wait_for_results() {
        await this.page.waitForSelector('.section-listbox-root .section-result', { timeout: this.STANDARD_TIMEOUT });
        // more than 1 result
        await this.page.waitForFunction("document.querySelectorAll('.section-result').length > 0", { timeout: 5000 });
        await this.page.waitForNavigation();
    }

    async detected() {
        const title = await this.page.title();
        let html = await this.page.content();
        return html.indexOf('detected unusual traffic') !== -1 || title.indexOf('/sorry/') !== -1;
    }
}


class GoogleShoppingScraper extends Scraper {

    constructor(...args) {
        super(...args);
    }

    parse(html) {
        // load the page source into cheerio
        const $ = cheerio.load(html);

        const results = [];
        $('.sh-dlr__list-result').each((i, link) => {
            results.push({
                price: $(link).find('.sh-dlr__content div:nth-child(2) span > span').text(),
                link: $(link).find('.sh-dlr__thumbnail a').attr('href'),
                title: $(link).find('div > div > a[data-what="1"]').text(),
                info1: $(link).find('.sh-dlr__content div:nth-child(2)').text(),
                info2: $(link).find('.sh-dlr__content div:nth-child(3)').text(),
                info3: $(link).find('.sh-dlr__content div:nth-child(4)').text(),
            })
        });

        const grid_results = [];

        $('.sh-pr__product-results-grid .sh-dgr__grid-result').each((i, link) => {
            grid_results.push({
                price: $(link).find('.sh-dgr__content div:nth-child(2) span').text(),
                link: $(link).find('.sh-dgr__content a').attr('href'),
                title: $(link).find('.sh-dgr__content a').text(),
                info: $(link).find('.sh-dgr__content').text(),
            })
        });

        // 'Ergebnisse für', 'Showing results for'
        let no_results = this.no_results(
            ['Es wurden keine mit deiner Suchanfrage', 'did not match any documents', 'Keine Ergebnisse für',
                'No results found for'],
            $('#main').text()
        );

        const cleaned = this.clean_results(results, ['title', 'link']);

        return {
            time: (new Date()).toUTCString(),
            no_results: no_results,
            results: cleaned,
            grid_results: grid_results,
        }

    }

    async load_start_page() {
        let startUrl = 'https://www.google.com/shopping?';

        if (this.config.google_settings) {
            startUrl = `https://www.${this.config.google_settings.google_domain}/shopping?q=`;
            if (this.config.google_settings.google_domain) {
                startUrl = `https://www.${this.config.google_settings.google_domain}/shopping?`;
            } else {
                startUrl = `https://www.google.com/shopping?`;
            }

            for (var key in this.config.google_settings) {
                if (key !== 'google_domain') {
                    startUrl += `${key}=${this.config.google_settings[key]}&`
                }
            }
        }

        this.logger.info('Using startUrl: ' + startUrl);

        this.last_response = await this.page.goto(startUrl);

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

        return true;
    }

    async wait_for_results() {
        await this.page.waitForSelector('#fbar', { timeout: this.STANDARD_TIMEOUT });
    }

    async detected() {
        const title = await this.page.title();
        let html = await this.page.content();
        return html.indexOf('detected unusual traffic') !== -1 || title.indexOf('/sorry/') !== -1;
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


module.exports = {
    GoogleShoppingScraper: GoogleShoppingScraper,
    GoogleNewsOldScraper: GoogleNewsOldScraper,
    GoogleScraper: GoogleScraper,
    GoogleImageScraper: GoogleImageScraper,
    GoogleNewsScraper: GoogleNewsScraper,
    GoogleMapsScraper: GoogleMapsScraper,
};


// https://developers.google.com/custom-search/v1/cse/list

const GOOGLE_DOMAINS = {
    'Samoa': 'google.ws',
    'Vanuatu': 'google.vu',
    'British Virgin Islands': 'google.vg',
    'Trinidad and Tobago': 'google.tt',
    'Tonga': 'google.to',
    'Tunisia': 'google.tn',
    'Turkmenistan': 'google.tm',
    'Timor-Leste': 'google.tl',
    'Tokelau': 'google.tk',
    'Togo': 'google.tg',
    'Chad': 'google.td',
    'São Tomé and Príncipe': 'google.st',
    'Suriname': 'google.sr',
    'Somalia': 'google.so',
    'Senegal': 'google.sn',
    'San Marino': 'google.sm',
    'Slovakia': 'google.sk',
    'Slovenia': 'google.si',
    'Saint Helena, Ascension and Tristan da Cunha': 'google.sh',
    'Sweden': 'google.se',
    'Seychelles': 'google.sc',
    'Rwanda': 'google.rw',
    'Russia': 'google.ru',
    'Serbia': 'google.rs',
    'Romania': 'google.ro',
    'Portugal': 'google.pt',
    'Palestine[3]': 'google.ps',
    'Pitcairn Islands': 'google.co.pn',
    'Poland': 'google.pl',
    'Niue': 'google.nu',
    'Nauru': 'google.nr',
    'Norway': 'google.no',
    'Netherlands': 'google.nl',
    'Niger': 'google.ne',
    'Malawi': 'google.mw',
    'Maldives': 'google.mv',
    'Mauritius': 'google.mu',
    'Montserrat': 'google.ms',
    'Mongolia': 'google.mn',
    'Mali': 'google.ml',
    'Macedonia': 'google.mk',
    'Madagascar': 'google.mg',
    'Montenegro': 'google.me',
    'Moldova': 'google.md',
    'Latvia': 'google.lv',
    'Luxembourg': 'google.lu',
    'Lithuania': 'google.lt',
    'Sri Lanka': 'google.lk',
    'Liechtenstein': 'google.li',
    'Laos': 'google.la',
    'Kazakhstan': 'google.kz',
    'Kiribati': 'google.ki',
    'Kyrgyzstan': 'google.kg',
    'Jordan': 'google.jo',
    'Jersey': 'google.je',
    'Italy': 'google.it',
    'Iceland': 'google.is',
    'Iraq': 'google.iq',
    'British Indian Ocean Territory': 'google.io',
    'Isle of Man': 'google.im',
    'Ireland': 'google.ie',
    'Hungary': 'google.hu',
    'Haiti': 'google.ht',
    'Croatia': 'google.hr',
    'Honduras': 'google.hn',
    'Guyana': 'google.gy',
    'Greece': 'google.gr',
    'Guadeloupe': 'google.gp',
    'Gambia': 'google.gm',
    'Greenland': 'google.gl',
    'Guernsey': 'google.gg',
    'French Guiana': 'google.gf',
    'Georgia': 'google.ge',
    'Gabon': 'google.ga',
    'France': 'google.fr',
    'Federated States of Micronesia': 'google.fm',
    'Finland': 'google.fi',
    'Spain': 'google.es',
    'Estonia': 'google.ee',
    'Algeria': 'google.dz',
    'Dominica': 'google.dm',
    'Denmark': 'google.dk',
    'Djibouti': 'google.dj',
    'Germany': 'google.de',
    'Czech Republic': 'google.cz',
    'Cape Verde': 'google.cv',
    'Vietnam': 'google.com.vn',
    'Saint Vincent and the Grenadines': 'google.com.vc',
    'Uruguay': 'google.com.uy',
    'Ukraine': 'google.com.ua',
    'Taiwan': 'google.com.tw',
    'Turkey': 'google.com.tr',
    'Tajikistan': 'google.com.tj',
    'El Salvador': 'google.com.sv',
    'Sierra Leone': 'google.com.sl',
    'Singapore': 'google.com.sg',
    'Solomon Islands': 'google.com.sb',
    'Saudi Arabia': 'google.com.sa',
    'Qatar': 'google.com.qa',
    'Paraguay': 'google.com.py',
    'Puerto Rico': 'google.com.pr',
    'Pakistan': 'google.com.pk',
    'Philippines': 'google.com.ph',
    'Papua New Guinea': 'google.com.pg',
    'Peru': 'google.com.pe',
    'Panama': 'google.com.pa',
    'Oman': 'google.com.om',
    'Nepal': 'google.com.np',
    'Nicaragua': 'google.com.ni',
    'Nigeria': 'google.com.ng',
    'Norfolk Island': 'google.com.nf',
    'Namibia': 'google.com.na',
    'Malaysia': 'google.com.my',
    'Mexico': 'google.com.mx',
    'Malta': 'google.com.mt',
    'Myanmar': 'google.com.mm',
    'Libya': 'google.com.ly',
    'Saint Lucia': 'google.com.lc',
    'Lebanon': 'google.com.lb',
    'Kuwait': 'google.com.kw',
    'Cambodia': 'google.com.kh',
    'Jamaica': 'google.com.jm',
    'Hong Kong': 'google.com.hk',
    'Guatemala': 'google.com.gt',
    'Gibraltar': 'google.com.gi',
    'Ghana': 'google.com.gh',
    'Fiji': 'google.com.fj',
    'Ethiopia': 'google.com.et',
    'Egypt': 'google.com.eg',
    'Ecuador': 'google.com.ec',
    'Dominican Republic': 'google.com.do',
    'Cyprus': 'google.com.cy',
    'Cuba': 'google.com.cu',
    'Colombia': 'google.com.co',
    'Belize': 'google.com.bz',
    'Brazil': 'google.com.br',
    'Bolivia': 'google.com.bo',
    'Brunei': 'google.com.bn',
    'Bahrain': 'google.com.bh',
    'Bangladesh': 'google.com.bd',
    'Australia': 'google.com.au',
    'Argentina': 'google.com.ar',
    'Anguilla': 'google.com.ai',
    'Antigua and Barbuda': 'google.com.ag',
    'Afghanistan': 'google.com.af',
    'Worldwide (Original for the United States)': 'google.com',
    'United States': 'google.com',
    'Zimbabwe': 'google.co.zw',
    'Zambia': 'google.co.zm',
    'South Africa': 'google.co.za',
    'United States Virgin Islands': 'google.co.vi',
    'Venezuela': 'google.co.ve',
    'Uzbekistan': 'google.co.uz',
    'United Kingdom': 'google.co.uk',
    'Uganda': 'google.co.ug',
    'Tanzania': 'google.co.tz',
    'Thailand': 'google.co.th',
    'New Zealand': 'google.co.nz',
    'Mozambique': 'google.co.mz',
    'Morocco': 'google.co.ma',
    'Lesotho': 'google.co.ls',
    'South Korea': 'google.co.kr',
    'Kenya': 'google.co.ke',
    'Japan': 'google.co.jp',
    'India': 'google.co.in',
    'Israel': 'google.co.il',
    'Indonesia': 'google.co.id',
    'Costa Rica': 'google.co.cr',
    'Cook Islands': 'google.co.ck',
    'Botswana': 'google.co.bw',
    'Angola': 'google.co.ao',
    'China': 'google.cn',
    'Cameroon': 'google.cm',
    'Chile': 'google.cl',
    'Ivory Coast': 'google.ci',
    'Switzerland': 'google.ch',
    'Republic of the Congo': 'google.cg',
    'Central African Republic': 'google.cf',
    'Democratic Republic of the Congo': 'google.cd',
    'Cocos (Keeling) Islands': 'google.cc',
    'Catalan Countries': 'google.cat',
    'Canada': 'google.ca',
    'Belarus': 'google.by',
    'Bhutan': 'google.bt',
    'Bahamas': 'google.bs',
    'Benin': 'google.bj',
    'Burundi': 'google.bi',
    'Bulgaria': 'google.bg',
    'Burkina Faso': 'google.bf',
    'Belgium': 'google.be',
    'Bosnia and Herzegovina': 'google.ba',
    'Azerbaijan': 'google.az',
    'Austria': 'google.at',
    'American Samoa': 'google.as',
    'Armenia': 'google.am',
    'Albania': 'google.al',
    'United Arab Emirates': 'google.ae',
    'Andorra': 'google.ad',
    'Ascension Island': 'google.ac'
};

// https://developers.google.com/custom-search/docs/xml_results_appendices#countryCodes
// The gl parameter determines the Google country to use for the query.
const GOOGLE_GL = {'af': 'Afghanistan',
    'al': 'Albania',
    'dz': 'Algeria',
    'as': 'American Samoa',
    'ad': 'Andorra',
    'ao': 'Angola',
    'ai': 'Anguilla',
    'aq': 'Antarctica',
    'ag': 'Antigua and Barbuda',
    'ar': 'Argentina',
    'am': 'Armenia',
    'aw': 'Aruba',
    'au': 'Australia',
    'at': 'Austria',
    'az': 'Azerbaijan',
    'bs': 'Bahamas',
    'bh': 'Bahrain',
    'bd': 'Bangladesh',
    'bb': 'Barbados',
    'by': 'Belarus',
    'be': 'Belgium',
    'bz': 'Belize',
    'bj': 'Benin',
    'bm': 'Bermuda',
    'bt': 'Bhutan',
    'bo': 'Bolivia',
    'ba': 'Bosnia and Herzegovina',
    'bw': 'Botswana',
    'bv': 'Bouvet Island',
    'br': 'Brazil',
    'io': 'British Indian Ocean Territory',
    'bn': 'Brunei Darussalam',
    'bg': 'Bulgaria',
    'bf': 'Burkina Faso',
    'bi': 'Burundi',
    'kh': 'Cambodia',
    'cm': 'Cameroon',
    'ca': 'Canada',
    'cv': 'Cape Verde',
    'ky': 'Cayman Islands',
    'cf': 'Central African Republic',
    'td': 'Chad',
    'cl': 'Chile',
    'cn': 'China',
    'cx': 'Christmas Island',
    'cc': 'Cocos (Keeling) Islands',
    'co': 'Colombia',
    'km': 'Comoros',
    'cg': 'Congo',
    'cd': 'Congo, the Democratic Republic of the',
    'ck': 'Cook Islands',
    'cr': 'Costa Rica',
    'ci': "Cote D'ivoire",
    'hr': 'Croatia',
    'cu': 'Cuba',
    'cy': 'Cyprus',
    'cz': 'Czech Republic',
    'dk': 'Denmark',
    'dj': 'Djibouti',
    'dm': 'Dominica',
    'do': 'Dominican Republic',
    'ec': 'Ecuador',
    'eg': 'Egypt',
    'sv': 'El Salvador',
    'gq': 'Equatorial Guinea',
    'er': 'Eritrea',
    'ee': 'Estonia',
    'et': 'Ethiopia',
    'fk': 'Falkland Islands (Malvinas)',
    'fo': 'Faroe Islands',
    'fj': 'Fiji',
    'fi': 'Finland',
    'fr': 'France',
    'gf': 'French Guiana',
    'pf': 'French Polynesia',
    'tf': 'French Southern Territories',
    'ga': 'Gabon',
    'gm': 'Gambia',
    'ge': 'Georgia',
    'de': 'Germany',
    'gh': 'Ghana',
    'gi': 'Gibraltar',
    'gr': 'Greece',
    'gl': 'Greenland',
    'gd': 'Grenada',
    'gp': 'Guadeloupe',
    'gu': 'Guam',
    'gt': 'Guatemala',
    'gn': 'Guinea',
    'gw': 'Guinea-Bissau',
    'gy': 'Guyana',
    'ht': 'Haiti',
    'hm': 'Heard Island and Mcdonald Islands',
    'va': 'Holy See (Vatican City State)',
    'hn': 'Honduras',
    'hk': 'Hong Kong',
    'hu': 'Hungary',
    'is': 'Iceland',
    'in': 'India',
    'id': 'Indonesia',
    'ir': 'Iran, Islamic Republic of',
    'iq': 'Iraq',
    'ie': 'Ireland',
    'il': 'Israel',
    'it': 'Italy',
    'jm': 'Jamaica',
    'jp': 'Japan',
    'jo': 'Jordan',
    'kz': 'Kazakhstan',
    'ke': 'Kenya',
    'ki': 'Kiribati',
    'kp': "Korea, Democratic People's Republic of",
    'kr': 'Korea, Republic of',
    'kw': 'Kuwait',
    'kg': 'Kyrgyzstan',
    'la': "Lao People's Democratic Republic",
    'lv': 'Latvia',
    'lb': 'Lebanon',
    'ls': 'Lesotho',
    'lr': 'Liberia',
    'ly': 'Libyan Arab Jamahiriya',
    'li': 'Liechtenstein',
    'lt': 'Lithuania',
    'lu': 'Luxembourg',
    'mo': 'Macao',
    'mk': 'Macedonia, the Former Yugosalv Republic of',
    'mg': 'Madagascar',
    'mw': 'Malawi',
    'my': 'Malaysia',
    'mv': 'Maldives',
    'ml': 'Mali',
    'mt': 'Malta',
    'mh': 'Marshall Islands',
    'mq': 'Martinique',
    'mr': 'Mauritania',
    'mu': 'Mauritius',
    'yt': 'Mayotte',
    'mx': 'Mexico',
    'fm': 'Micronesia, Federated States of',
    'md': 'Moldova, Republic of',
    'mc': 'Monaco',
    'mn': 'Mongolia',
    'ms': 'Montserrat',
    'ma': 'Morocco',
    'mz': 'Mozambique',
    'mm': 'Myanmar',
    'na': 'Namibia',
    'nr': 'Nauru',
    'np': 'Nepal',
    'nl': 'Netherlands',
    'an': 'Netherlands Antilles',
    'nc': 'New Caledonia',
    'nz': 'New Zealand',
    'ni': 'Nicaragua',
    'ne': 'Niger',
    'ng': 'Nigeria',
    'nu': 'Niue',
    'nf': 'Norfolk Island',
    'mp': 'Northern Mariana Islands',
    'no': 'Norway',
    'om': 'Oman',
    'pk': 'Pakistan',
    'pw': 'Palau',
    'ps': 'Palestinian Territory, Occupied',
    'pa': 'Panama',
    'pg': 'Papua New Guinea',
    'py': 'Paraguay',
    'pe': 'Peru',
    'ph': 'Philippines',
    'pn': 'Pitcairn',
    'pl': 'Poland',
    'pt': 'Portugal',
    'pr': 'Puerto Rico',
    'qa': 'Qatar',
    're': 'Reunion',
    'ro': 'Romania',
    'ru': 'Russian Federation',
    'rw': 'Rwanda',
    'sh': 'Saint Helena',
    'kn': 'Saint Kitts and Nevis',
    'lc': 'Saint Lucia',
    'pm': 'Saint Pierre and Miquelon',
    'vc': 'Saint Vincent and the Grenadines',
    'ws': 'Samoa',
    'sm': 'San Marino',
    'st': 'Sao Tome and Principe',
    'sa': 'Saudi Arabia',
    'sn': 'Senegal',
    'cs': 'Serbia and Montenegro',
    'sc': 'Seychelles',
    'sl': 'Sierra Leone',
    'sg': 'Singapore',
    'sk': 'Slovakia',
    'si': 'Slovenia',
    'sb': 'Solomon Islands',
    'so': 'Somalia',
    'za': 'South Africa',
    'gs': 'South Georgia and the South Sandwich Islands',
    'es': 'Spain',
    'lk': 'Sri Lanka',
    'sd': 'Sudan',
    'sr': 'Suriname',
    'sj': 'Svalbard and Jan Mayen',
    'sz': 'Swaziland',
    'se': 'Sweden',
    'ch': 'Switzerland',
    'sy': 'Syrian Arab Republic',
    'tw': 'Taiwan, Province of China',
    'tj': 'Tajikistan',
    'tz': 'Tanzania, United Republic of',
    'th': 'Thailand',
    'tl': 'Timor-Leste',
    'tg': 'Togo',
    'tk': 'Tokelau',
    'to': 'Tonga',
    'tt': 'Trinidad and Tobago',
    'tn': 'Tunisia',
    'tr': 'Turkey',
    'tm': 'Turkmenistan',
    'tc': 'Turks and Caicos Islands',
    'tv': 'Tuvalu',
    'ug': 'Uganda',
    'ua': 'Ukraine',
    'ae': 'United Arab Emirates',
    'uk': 'United Kingdom',
    'us': 'United States',
    'um': 'United States Minor Outlying Islands',
    'uy': 'Uruguay',
    'uz': 'Uzbekistan',
    'vu': 'Vanuatu',
    've': 'Venezuela',
    'vn': 'Viet Nam',
    'vg': 'Virgin Islands, British',
    'vi': 'Virgin Islands, U.S.',
    'wf': 'Wallis and Futuna',
    'eh': 'Western Sahara',
    'ye': 'Yemen',
    'zm': 'Zambia',
    'zw': 'Zimbabwe'
};


// https://developers.google.com/custom-search/docs/xml_results_appendices#interfaceLanguages
// The hl parameter determines the Google UI language to return results.
const GOOGLE_HL = {
    'af': 'Afrikaans',
    'sq': 'Albanian',
    'sm': 'Amharic',
    'ar': 'Arabic',
    'az': 'Azerbaijani',
    'eu': 'Basque',
    'be': 'Belarusian',
    'bn': 'Bengali',
    'bh': 'Bihari',
    'bs': 'Bosnian',
    'bg': 'Bulgarian',
    'ca': 'Catalan',
    'zh-CN': 'Chinese (Simplified)',
    'zh-TW': 'Chinese (Traditional)',
    'hr': 'Croatian',
    'cs': 'Czech',
    'da': 'Danish',
    'nl': 'Dutch',
    'en': 'English',
    'eo': 'Esperanto',
    'et': 'Estonian',
    'fo': 'Faroese',
    'fi': 'Finnish',
    'fr': 'French',
    'fy': 'Frisian',
    'gl': 'Galician',
    'ka': 'Georgian',
    'de': 'German',
    'el': 'Greek',
    'gu': 'Gujarati',
    'iw': 'Hebrew',
    'hi': 'Hindi',
    'hu': 'Hungarian',
    'is': 'Icelandic',
    'id': 'Indonesian',
    'ia': 'Interlingua',
    'ga': 'Irish',
    'it': 'Italian',
    'ja': 'Japanese',
    'jw': 'Javanese',
    'kn': 'Kannada',
    'ko': 'Korean',
    'la': 'Latin',
    'lv': 'Latvian',
    'lt': 'Lithuanian',
    'mk': 'Macedonian',
    'ms': 'Malay',
    'ml': 'Malayam',
    'mt': 'Maltese',
    'mr': 'Marathi',
    'ne': 'Nepali',
    'no': 'Norwegian',
    'nn': 'Norwegian (Nynorsk)',
    'oc': 'Occitan',
    'fa': 'Persian',
    'pl': 'Polish',
    'pt-BR': 'Portuguese (Brazil)',
    'pt-PT': 'Portuguese (Portugal)',
    'pa': 'Punjabi',
    'ro': 'Romanian',
    'ru': 'Russian',
    'gd': 'Scots Gaelic',
    'sr': 'Serbian',
    'si': 'Sinhalese',
    'sk': 'Slovak',
    'sl': 'Slovenian',
    'es': 'Spanish',
    'su': 'Sudanese',
    'sw': 'Swahili',
    'sv': 'Swedish',
    'tl': 'Tagalog',
    'ta': 'Tamil',
    'te': 'Telugu',
    'th': 'Thai',
    'ti': 'Tigrinya',
    'tr': 'Turkish',
    'uk': 'Ukrainian',
    'ur': 'Urdu',
    'uz': 'Uzbek',
    'vi': 'Vietnamese',
    'cy': 'Welsh',
    'xh': 'Xhosa',
    'zu': 'Zulu'
};
