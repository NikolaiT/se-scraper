'use strict';
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

var files = ['google.html', 'google2.html', 'google3.html', 'bing.html', 'bing2.html'];

for (var file of files) {
	var html = fs.readFileSync(path.resolve(__dirname, './html/' + file));

	var compressed = zlib.gzipSync(html);
	var deflated = zlib.deflateSync(html);

	var compressed_encoded = compressed.toString('base64');
	var deflated_encoded = deflated.toString('base64');

	console.log(file)
	console.log('Normal length: ' + html.length/1000);
	console.log('GZIP Compressed length: ' +  compressed.length/1000);
	console.log('Deflate Compressed length: ' +  deflated.length/1000);
	console.log('Encoded GZIP Compressed length: ' +  compressed_encoded.length/1000);
	console.log('Encoded Deflate Compressed length: ' +  deflated_encoded.length/1000);
	console.log('------\n')
}
