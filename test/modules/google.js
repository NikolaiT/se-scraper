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

    it('extract google shopping', function () {
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
            assert.strictEqual(results['test keyword']['1'].results.length, 10, 'Must have 10 organic results parsed on page 1');
            assert.strictEqual(results['test keyword']['1'].results[0].title, 'Keyword Tool (FREE) ᐈ #1 Google Keyword Planner Alternative', 'Title not matching on first organic result page 1');
            assert.strictEqual(results['test keyword']['2'].results.length, 10, 'Must have 10 organic results parsed on page 2');
            assert.strictEqual(results['test keyword']['2'].results[0].title, 'Keyword Research | The Beginner\'s Guide to SEO - Moz', 'Title not matching on first organic result page 1');
            assert.strictEqual(results['test keyword']['3'].results.length, 10, 'Must have 10 organic results parsed on page 3');
            assert.strictEqual(results['test keyword']['3'].results[0].title, 'The ACT Keyword Study Plan — NerdCoach', 'Title not matching on first organic result page 1');
        });
    });

});