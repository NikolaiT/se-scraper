module.exports = {
	no_results: no_results,
	effective_query: effective_query,
    sleep: sleep,
    random_sleep: random_sleep,
    set_input_value: set_input_value,
};

async function set_input_value(page, selector, value) {
    await page.waitFor(selector);
    await page.evaluate((value, selector) => {
        return document.querySelector(selector).value = value;
    }, value, selector);
}

function no_results(needles, html) {
	return !needles.map((needle) => { return html.indexOf(needle)})
		.every((res) => { return res == -1});
}

function effective_query(needles, html) {
	return;
}

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

async function random_sleep(config) {
    var min, max;
    [min, max] = config.sleep_range;
    var rand = Math.floor(Math.random() * (max - min + 1) + min); //Generate Random number
    if (config.debug === true) {
        console.log(`Sleeping for ${rand}s`);
    }
    await sleep(rand * 1000);
}