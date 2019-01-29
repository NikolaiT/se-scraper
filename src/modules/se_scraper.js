const start_url = {
    'google': ''
};

/*
    Read this shit: https://javascript.info/class-inheritance
 */

module.exports = class Scraper {
    constructor(options = {}) {
        const {
            searchEngine = 'google',
            numPages = 1,
            pluggable = null,
        } = options;

        this.pluggable = pluggable;
        this.searchEngine = searchEngine;
        this.numPages = numPages;
        this.results = {}
    }

    async load_search_engine() {
    }

    async search_keyword() {
    }

    parse() {

    }

    async next_page() {
    }

    async detected() {

    }
};