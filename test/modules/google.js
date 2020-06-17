'use strict';
const express = require('express');
const puppeteer = require('puppeteer');
const { createLogger, transports } = require('winston');
const http = require('http');
const https = require('https');
const assert = require('assert');
const path = require('path');
const keyCert = require('key-cert');
const Promise = require('bluebird');
const Proxy = require('http-mitm-proxy');

const debug = require('debug')('se-scraper:test');
const { GoogleScraper } = require('../../src/modules/google');

const httpPort = 3012;
const httpsPort = httpPort + 1;
const proxyPort = httpPort + 2;

const fakeSearchEngine = express();
fakeSearchEngine.get('/search', (req, res) => {
    debug('q=%s', req.query.q);
    const pageNumber = ((req.query.start/10) || 0)  + 1;
    res.sendFile(path.join(__dirname, '../mocks/google/' + req.query.q + '_page' + pageNumber + '.html'));
});
fakeSearchEngine.use(express.static('test/mocks/google', {extensions: ['html']}));

describe('Module Google', function(){

    let httpServer, httpsServer, proxy;
    before(async function(){
        // Here mount our fake engine in both http and https listen server
        httpServer = http.createServer(fakeSearchEngine);
        httpsServer = https.createServer(await keyCert(), fakeSearchEngine);
        
        proxy = Proxy();
        proxy.onRequest((ctx, callback) => {
            ctx.proxyToServerRequestOptions.host = 'localhost';
            ctx.proxyToServerRequestOptions.port = (ctx.isSSL) ? httpsPort : httpPort;
            ctx.proxyToServerRequestOptions.headers['X-Forwarded-Host'] = 'ProxiedThroughFakeEngine';
            debug('connection proxied askedHost=%s toPort=%s', ctx.clientToProxyRequest.headers.host, ctx.proxyToServerRequestOptions.port);
            return callback();
        });

        await Promise.promisify(proxy.listen, { context: proxy })({ port: proxyPort });
        await Promise.promisify(httpServer.listen, {context: httpServer})(httpPort);
        await Promise.promisify(httpsServer.listen, {context: httpsServer})(httpsPort);
        debug('Fake http search engine servers started');
    });

    after(function(){
        proxy.close();
        httpsServer.close();
        httpServer.close();
    });

    let browser;
    let page;
    beforeEach(async function(){
        debug('Start a new browser');
        browser = await puppeteer.launch({
            //dumpio: true,
            //headless: false,
            ignoreHTTPSErrors: true,
            args: [ '--proxy-server=http://localhost:' + proxyPort ]
        });
        debug('Open a fresh page');
        page = await browser.newPage();
    });

    afterEach(async function(){
        await browser.close();
    });

    const testLogger = createLogger({
        transports: [
            new transports.Console({
                level: 'error'
            })
        ]
    });

    it('one keyword one page', function(){
        const googleScraper = new GoogleScraper({
            config: {
                search_engine_name: 'google',
                throw_on_detection: true,
                keywords: ['test keyword'],
                logger: testLogger,
                scrape_from_file: '',
            }
        });
        googleScraper.STANDARD_TIMEOUT = 500;
        return googleScraper.run({page}).then(({results, metadata, num_requests}) => {
            assert.strictEqual(num_requests, 1, 'Must do one request');
            assert.strictEqual(results['test keyword']['1'].results.length, 10, 'Must have 10 organic results parsed');
        });
    });

    it('one keyword 3 pages', function () {
        const googleScraper = new GoogleScraper({
            config: {
                search_engine_name: 'google',
                throw_on_detection: true,
                keywords: ['test keyword'],
                logger: testLogger,
                scrape_from_file: '',
                num_pages: 3,
            }
        });
        googleScraper.STANDARD_TIMEOUT = 500;
        return googleScraper.run({page}).then(({results, metadata, num_requests}) => {
            assert.strictEqual(num_requests, 3, 'Must three requests');
            assert.strictEqual(results['test keyword']['1'].results.length, 10, 'Must have 10 organic results parsed on page 1');
            assert.strictEqual(results['test keyword']['1'].results[0].title, 'Keyword Tool (FREE) ᐈ #1 Google Keyword Planner Alternative', 'Title not matching on first organic result page 1');
            assert.strictEqual(results['test keyword']['2'].results.length, 10, 'Must have 10 organic results parsed on page 2');
            assert.strictEqual(results['test keyword']['2'].results[0].title, 'Keyword Research | The Beginner\'s Guide to SEO - Moz', 'Title not matching on first organic result page 1');
            assert.strictEqual(results['test keyword']['3'].results.length, 10, 'Must have 10 organic results parsed on page 3');
            assert.strictEqual(results['test keyword']['3'].results[0].title, 'The ACT Keyword Study Plan — NerdCoach', 'Title not matching on first organic result page 1');
        });
    });

    it('extract google shopping on right', function () {
        const googleScraper = new GoogleScraper({
            config: {
                search_engine_name: 'google',
                throw_on_detection: true,
                keywords: ['shopping'],
                logger: testLogger,
                scrape_from_file: '',
                num_pages: 1,
            }
        });
        googleScraper.STANDARD_TIMEOUT = 500;
        return googleScraper.run({page}).then(({results, metadata, num_requests}) => {
            assert.strictEqual(num_requests, 1, 'One request should be done');
            assert.strictEqual(results['shopping']['1'].results.length, 10, 'Must have 10 organic results parsed on page 1');
            assert.deepEqual(results['shopping']['1'].top_products, [
                {
                    'link': 'https://www.laboutiqueofficielle.com/achat-baskets-basses/classic-series-baskets-317-blanc-144046.html?referer=gshopping&LGWCODE=3010559970809;160079;7403',
                    'merchant_name': 'LaBoutiqueOffi...',
                    'price': '39,99 €',
                    'rank': 1,
                    'title': 'Classic Series - Baskets 317 Blanc',
                    'tracking_link': '/aclk?sa=l&ai=DChcSEwjJqLX1v4bqAhXJlBgKHYRrDO4YABAEGgJsZQ&sig=AOD64_1OEdvZgHU2YEMPI4JNdeTqLJTVjw&ctype=5&q=&ved=2ahUKEwjPmK31v4bqAhXLxYUKHe8BByEQ9A56BAgOEFU&adurl=',
                    'vendor_link': 'https://www.google.com/search?tbm=shop&q=cheap%20lacoste%20shoes',
                },
                {
                    'link': 'https://www.chausport.com/p/lacoste-carnaby-evo-noire-enfant-173257.html',
                    'merchant_name': 'Chausport',
                    'price': '45,00 €',
                    'rank': 2,
                    'title': 'Tennis Lacoste Carnaby Evo Noire Enfant 28',
                    'tracking_link': '/aclk?sa=L&ai=DChcSEwjJqLX1v4bqAhXJlBgKHYRrDO4YABAFGgJsZQ&sig=AOD64_0lhZrLNYCENmxzquCMa5M4_D04ng&ctype=5&q=&ved=2ahUKEwjPmK31v4bqAhXLxYUKHe8BByEQ9A56BAgOEGA&adurl=',
                    'vendor_link': 'http://www.choozen.fr/nf/gs-cheap%20lacoste%20shoes.htm?kpartnerid=96955353',
                },
                {
                    'link': 'https://www.getthelabel.com/fr/p/lacoste-baskets-lerond-418/138256',
                    'merchant_name': 'GetTheLabel.c...',
                    'price': '44,99 €',
                    'rank': 3,
                    'title': 'Lacoste Baskets Lerond 418 Size 9 in Blanc pour Homme',
                    'tracking_link': '/aclk?sa=l&ai=DChcSEwjJqLX1v4bqAhXJlBgKHYRrDO4YABAIGgJsZQ&sig=AOD64_13MoA9It0w-yp3GqriMf13OPLI8w&ctype=5&q=&ved=2ahUKEwjPmK31v4bqAhXLxYUKHe8BByEQ9A56BAgOEG0&adurl=',
                    'vendor_link': 'https://highstreetone.com/?search=cheap%20lacoste%20shoes',
                },
                {
                    'link': 'https://www.sarenza.com/lacoste-carnaby-evo-120-2-s834061-br918-t76-p0000227925#size=39-39',
                    'merchant_name': 'Sarenza',
                    'price': '45,50 €',
                    'originalPrice': '65 €',
                    'rank': 4,
                    'title': 'Lacoste Carnaby Evo 120 2 Blanc - Baskets - Disponible en 39',
                    'tracking_link': '/aclk?sa=l&ai=DChcSEwjJqLX1v4bqAhXJlBgKHYRrDO4YABANGgJsZQ&sig=AOD64_1Q6WUe8YXjhb-y_k0rErD2WUsTqQ&ctype=5&q=&ved=2ahUKEwjPmK31v4bqAhXLxYUKHe8BByEQ9A56BAgOEHk&adurl=',
                    'vendor_link': 'https://www.feed-price.com/search/cheap%20lacoste%20shoes',
                },
                {
                    'link': 'https://www.spartoo.com/Lacoste-CARNABY-EVO-BL-1-x4736301.php?track_id=adwo_fgl&sx=B&utm_source=froogle&utm_medium=comparateurs&utm_content=4736301&utm_campaign=adwo_fgl&size_id=158&fcsize=1&sx=B',
                    'merchant_name': 'Spartoo.com',
                    'price': '58,00 €',
                    'rank': 5,
                    'title': 'Lacoste CARNABY EVO BL 1 Baskets basses enfant (garcons)',
                    'tracking_link': '/aclk?sa=l&ai=DChcSEwjJqLX1v4bqAhXJlBgKHYRrDO4YABAMGgJsZQ&sig=AOD64_0NfyG0tH5Pc7kPfADKcQflx78H1g&ctype=5&q=&ved=2ahUKEwjPmK31v4bqAhXLxYUKHe8BByEQ9A56BQgOEIcB&adurl=',
                    'vendor_link': 'https://www.google.com/search?tbm=shop&q=cheap%20lacoste%20shoes',
                },
                {
                    'link': 'https://www.nike.com/fr/t/nikecourt-royale-shoe-KyTwJwgV/749747-111',
                    'merchant_name': 'Nike Officiel',
                    'price': '55,00 €',
                    'rank': 6,
                    'title': 'Chaussure Nike Court Royale pour Homme - Blanc',
                    'tracking_link': '/aclk?sa=l&ai=DChcSEwjJqLX1v4bqAhXJlBgKHYRrDO4YABASGgJsZQ&sig=AOD64_2KQENuVGnvXutmSUufDSa4FnTYsw&ctype=5&q=&ved=2ahUKEwjPmK31v4bqAhXLxYUKHe8BByEQ9A56BQgOEJIB&adurl=',
                    'vendor_link': 'https://www.pricesearcher.com/css/search/?p=1&q=cheap%20lacoste%20shoes&utm_source=google&utm_medium=css',
                }
            ])
        });
    });

    it('extract google shopping on top', function () {
        const googleScraper = new GoogleScraper({
            config: {
                search_engine_name: 'google',
                throw_on_detection: true,
                keywords: ['shopping 2'],
                logger: testLogger,
                scrape_from_file: '',
                num_pages: 1,
            }
        });
        googleScraper.STANDARD_TIMEOUT = 500;
        return googleScraper.run({page}).then(({results, metadata, num_requests}) => {
            assert.strictEqual(num_requests, 1, 'One request should be done');
            assert.strictEqual(results['shopping 2']['1'].results.length, 10, 'Must have 10 organic results parsed on page 1');
            assert.deepEqual(results['shopping 2']['1'].top_products[2], {
                "link": "https://www.zalando.fr/lacoste-sideline-cub-chaussons-pour-bebe-whitegreen-la216f003-k11.html?size=17&allophones=0",
                "merchant_name": "Zalando.fr",
                "price": "31,95 €",
                "rank": 3,
                'shipping': 'Livraison gratuite',
                "title": "Lacoste Sideline CUB Cadeau de naissance white/green, gender.kids.unisex, Taille: 17, Blanc - Imitation cuir/textile",
                "tracking_link": "/aclk?sa=l&ai=DChcSEwjt7o3yj4nqAhVZhdUKHbshBNwYABASGgJ3cw&sig=AOD64_0usikwrH4jD5vqtbS7vVoCrNxMOg&ctype=5&q=&ved=2ahUKEwj0w4fyj4nqAhWZDGMBHY7HAzAQww96BAgOEFI&adurl=",
                "vendor_link": "https://fr.shoptail.eu/cheap%20lacoste%20shoes",
            })
        });
    });

    it('shopping extract right one product', function () {
        const googleScraper = new GoogleScraper({
            config: {
                search_engine_name: 'google',
                throw_on_detection: true,
                keywords: ['shopping right product review'],
                logger: testLogger,
                scrape_from_file: '',
                num_pages: 1,
            }
        });
        googleScraper.STANDARD_TIMEOUT = 500;
        return googleScraper.run({page}).then(({results, metadata, num_requests}) => {
            assert.strictEqual(num_requests, 1, 'One request should be done');
            assert.strictEqual(results['shopping right product review']['1'].results.length, 9, 'Must have 9 organic results parsed on page 1');
            assert.deepEqual(results['shopping right product review']['1'].right_info, {
                title: 'Lacoste Lunettes',
                'num_reviews': '146 avis',
                'review': 'Note : 4,6 sur 5',
                'vendors': [
                    {
                        'info': '317 · 2807',
                        'merchant_ad_link': 'https://www.googleadservices.com/pagead/aclk?sa=L&ai=DChcSEwihq9C82ojqAhUIyrIKHbIHAx8YABACGgJscg&ohost=www.google.com&cid=CAASE-Roz5UHMJg95vk99OwXQnKbUG0&sig=AOD64_0Wfsw3t3eO_yEtq8lWRIjiF6EqZw&ctype=5&q=&ved=2ahUKEwjsqsi82ojqAhVFPBoKHY38DAIQ9A56BAgNEH0&adurl=',
                        'merchant_name': 'Edel-Optics FR',
                        'price': '102,75 €',
                        'shipping': 'Livraison gratuite',
                        'source_link': 'https://www.google.com/search?tbm=shop&q=lacoste%20317',
                        'source_name': 'Par Google',
                    },
                    {
                        'info': '317 · 2805',
                        'merchant_ad_link': 'https://www.googleadservices.com/pagead/aclk?sa=L&ai=DChcSEwihq9C82ojqAhUIyrIKHbIHAx8YABADGgJscg&ohost=www.google.com&cid=CAASE-Roz5UHMJg95vk99OwXQnKbUG0&sig=AOD64_2R4Idoiqc783K8OLyv9W9YQTJfog&ctype=5&q=&ved=2ahUKEwjsqsi82ojqAhVFPBoKHY38DAIQ9A56BQgNEIEB&adurl=',
                        'merchant_name': 'EasyLunettes.fr',
                        'price': '75,00 €',
                        'shipping': 'Livraison gratuite',
                        'source_link': 'https://producthero.com/?utm_source=google&utm_medium=css&q=lacoste%20317',
                        'source_name': 'Par Producthero',
                    }
                ]
            });
        });
    });

});
