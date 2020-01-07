'use strict';
const express = require('express');
const puppeteer = require('puppeteer');
// TODO add a test logger in place of default winston logger
const logger = require('winston');
const net = require('net');
const http = require('http');
const https = require('https');
const url = require('url');
const assert = require('assert');
const path = require('path');
const keyCert = require('key-cert');
const Promise = require('bluebird');

const debug = require('debug')('se-scraper:test');
const { BingScraper } = require('../../src/modules/bing');

const httpPort = 3012;
const httpsPort = httpPort + 1;

const fakeSearchEngine = express();
fakeSearchEngine.get('/search', (req, res, next) => {
    debug('q=%s', req.query.q);
    const pageNumber = ((req.query.start/10) || 0)  + 1;
    res.sendFile(path.join(__dirname, '../mocks/bing/' + req.query.q + '_page' + pageNumber + '.html'));
});
fakeSearchEngine.use(express.static('test/mocks/bing', {extensions: ['html']}));

describe('Module Bing', function(){

    let httpServerAndProxy, httpsServer;
    before(async function(){
        // Here mount our fake engine in both http and https listen server
        httpServerAndProxy = http.createServer(fakeSearchEngine);
        httpsServer = https.createServer(await keyCert(), fakeSearchEngine);
        
        /**
         * express doesn't handle HTTP CONNECT method, this implement a basic MITM http proxy
         * here we use our http server to also act as a http proxy and rewrite all http/s request to our fake engine
         */
        httpServerAndProxy.on('connect', (req, clientSocket, head) => {
            const parsedUrl = url.parse('http://' + req.url);
            const destPort = (parseInt(parsedUrl.port) === 443) ? httpsPort : httpPort;
            const serverSocket = net.connect(destPort, 'localhost', () => {
                debug('connection proxied askedHost=%s toPort=%s', parsedUrl.host, destPort);
                clientSocket.write('HTTP/1.1 200 Connection Established\r\n' +
                    'Proxy-agent: Node.js-Proxy\r\n' +
                    '\r\n');
                serverSocket.write(head);
                serverSocket.pipe(clientSocket);
                clientSocket.pipe(serverSocket);
                serverSocket.on('error', (err)=>{
                    console.error(err);
                });
            });
        });

        await Promise.promisify(httpServerAndProxy.listen, {context: httpServerAndProxy})(httpPort);
        await Promise.promisify(httpsServer.listen, {context: httpsServer})(httpsPort);
        debug('Fake http search engine servers started');
    });

    after(function(){
        httpsServer.close();
        httpServerAndProxy.close();
    });

    let browser;
    let page;
    beforeEach(async function(){
        debug('Start a new browser');
        browser = await puppeteer.launch({
            //dumpio: true,
            ignoreHTTPSErrors: true,
            args: [ '--proxy-server=http://localhost:' + httpPort ]
        });
        debug('Open a fresh page');
        page = await browser.newPage();
    });

    afterEach(async function(){
        await browser.close();
    });

    it('one keyword one page', function(){
        const bingScraper = new BingScraper({
            config: {
                search_engine_name: 'bing',
                throw_on_detection: true,
                keywords: ['test keyword'],
                logger,
                scrape_from_file: '',
            }
        });
        bingScraper.STANDARD_TIMEOUT = 500;
        return bingScraper.run({page}).then(({results, metadata, num_requests}) => {
            assert.strictEqual(num_requests, 1, 'Must do one request');
            assert.strictEqual(results['test keyword']['1'].results.length, 10, 'Must have 10 organic results parsed');
        });
    });

    it('one keyword 3 pages', function () {
        const bingScraper = new BingScraper({
            config: {
                search_engine_name: 'bing',
                throw_on_detection: true,
                keywords: ['test keyword'],
                logger,
                scrape_from_file: '',
                num_pages: 3,
            }
        });
        bingScraper.STANDARD_TIMEOUT = 500;
        return bingScraper.run({page}).then(({results, metadata, num_requests}) => {
            assert.strictEqual(num_requests, 3, 'Must three requests');
            assert.strictEqual(results['test keyword']['1'].results.length, 10, 'Must have 10 organic results parsed on page 1');
            assert.strictEqual(results['test keyword']['1'].results[0].title, 'Keyword Tool (FREE) ᐈ #1 Google Keyword Planner Alternative', 'Title not matching on first organic result page 1');
            assert.strictEqual(results['test keyword']['2'].results.length, 10, 'Must have 10 organic results parsed on page 2');
            assert.strictEqual(results['test keyword']['2'].results[0].title, 'Keyword Research | The Beginner\'s Guide to SEO - Moz', 'Title not matching on first organic result page 1');
            assert.strictEqual(results['test keyword']['3'].results.length, 10, 'Must have 10 organic results parsed on page 3');
            assert.strictEqual(results['test keyword']['3'].results[0].title, 'The ACT Keyword Study Plan — NerdCoach', 'Title not matching on first organic result page 1');
        });
    });

});