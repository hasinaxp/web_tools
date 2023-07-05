import http from 'http'
import { parse } from 'url'

export default function fetch(url, options) {

	let parsedUrl = parse(url);

	let method = 'GET';
	let hasDataToSend = false;
	let hasHeaders = false;
	if(options) {
		if(options.method)
			method = options.method;
		if(options.body)
			hasDataToSend = true;
		if(options.headers)
			hasHeaders = true;
	}

	let opts = {
		port: parsedUrl.port ?? 80,
		hostname: parsedUrl.hostname,
		method,
		path: parsedUrl.path
	}
	if(hasHeaders)
		options.headers = options.headers;

	return new Promise( (resolve, reject) => {
		let output = {};
		output.text = function(){
			let buff = this.buffer;
			return new Promise((rslv, rjct) => {
				let txt = Buffer.from(buff).toString('utf8');
				rslv(txt);
			});
		}
		output.json = function(){
			return new Promise((rslv, rjct) => {
				let buff = this.buffer;
				try {
					let jsn = JSON.parse(Buffer.from(this.buffer).toString('utf8'));
					rslv(jsn);
				}catch(error) {
					reject(error.message);
				}
			});
		}
		let chunks = [];
		const req = http.request(opts, (res) => {
			output.status = res.statusCode;

			res.on('data', chunk => {
				chunks.push(chunk);
			})
			res.on('end', () => {
				output.buffer = Buffer.concat(chunks);
				resolve(output);
			});
			res.on('error', (err) => {
				output.err = err;
				reject(output);
			})
		});
		if(hasDataToSend)
			req.write(options.body);
		req.end();
	});
}