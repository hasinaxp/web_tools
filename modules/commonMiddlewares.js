import zlib from 'zlib';
import { stringToBytes, stringToArrayBuffer } from "./utils.js";
import Mime from './mime.js';

export function cros() {
	return (req, res, next) => {

		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
		res.setHeader('Access-Control-Allow-Headers', '*');
		res.setHeader('Access-Control-Allow-Credentials', true);
		next();
	}
}


function inflateData(input, type) {
	let output;

	switch (type) {
		case 'br':
			output = zlib.brotliDecompressSync(input);
			break;
		case 'gzip':
			output = zlib.gunzipSync(input);
			break;
		case 'deflate':
			data = zlib.inflateSync(input);
			break;
		default:
			output = input;
			break;
	}

	return output;
}


export function json() {
	let inflate = true;
	let limit = '1mb';
	let verify = null;
	let reviver = null;
	if (arguments.length) {
		if (arguments[0].hasOwnProperty('inflate'))
			inflate = arguments[0].inflate;
		if (arguments[0].hasOwnProperty('limit'))
			limit = arguments[0].limit;
		if (arguments[0].hasOwnProperty('verify'))
			verify = arguments[0].verify;
		if (arguments[0].hasOwnProperty('reviver'))
			reviver = arguments[0].reviver;
	}

	return (req, res, next) => {

		if (req.hasBodyData && req.get('content-type') === 'application/json') {
			if (req.rawBodyLength > stringToBytes(limit))
				throw Error(413);

			let data;
			if (inflate)
				data = inflateData(req.rawBody, req.get('Content-Encoding')).toString('utf8');
			else
				data = req.rawBody.toString('utf8');

			if(verify)
				verify(req, res, req.rawBody, req.get('Content-Encoding'));

			if (reviver) {
				req.body = JSON.parse(data, reviver);
			}
			else {
				req.body = JSON.parse(data);
			}
		}
		next();
	}
}

export function urlencoded() {
	let inflate = true;
	let limit = '1mb';
	let verify = null;
	if (arguments.length) {
		if (arguments[0].hasOwnProperty('inflate'))
			inflate = arguments[0].inflate;
		if (arguments[0].hasOwnProperty('limit'))
			limit = arguments[0].limit;
		if (arguments[0].hasOwnProperty('verify'))
			verify = arguments[0].verify;
	}

	return (req, res, next) => {

		if (req.hasBodyData && req.get('content-type') === 'application/x-www-form-urlencoded') {
			if (req.rawBodyLength > stringToBytes(limit))
				throw Error(413);

			let data;
			if (inflate)
				data = inflateData(req.rawBody, req.get('Content-Encoding')).toString('utf8');
			else
				data = req.rawBody.toString('utf8');

			if(verify)
				verify(req, res, req.rawBody, req.get('Content-Encoding'));

			data = data.split('&');
			req.body = {};
			for (let d of data) {
				let x = d.split('=');
				req.body[decodeURIComponent(x[0])] = decodeURIComponent(x[1]);
			}
		}
		next();
	}
}

export function formdata() {
	let limit = '10mb';
	if (arguments.length) {
		if (arguments[0].hasOwnProperty('limit'))
			limit = arguments[0].limit;
	}

	return (req, res, next) => {


		let ctype = req.get('content-type');
		if (ctype && ctype.includes('multipart/form-data')) {

			if (req.rawBodyLength > stringToBytes(limit))
				throw Error(413);
			

			const m = req.get('content-type').match(/boundary=(?:"([^"]+)"|([^;]+))/i);

			if (!m) {
				throw new Error('no multipart boundary');
			}
			
			let boundary = m[1] ? '\r\n--' + m[1] || m[2] : '\r\n--' + m[2];


			const  parseHeader = (header) => {
				let headerFields = {};
				let matchResult = header.match(/^.*name="([^"]*)"$/);
				if (matchResult) headerFields.name = matchResult[1];
				let matchResult2 = header.match(/^.*filename="([^"]*)"$/);
				if (matchResult2) headerFields.filename = matchResult2[1];
				let matchResult3 = header.match(/^.*Content-Type: ([^"]*)$/);
				if (matchResult3) headerFields.contentType = matchResult3[1];
				return headerFields;
			}
			
			function Utf8ArrayToStr(arr) {
					let len = arr.length;
					let out = "";
					let i = 0;
					while(i < len) {
						out += String.fromCharCode(arr[i++]);
					}
					return out;
			}
			let ArrayView = new Uint8Array(req.rawBody);
			let stringView = '\r\n' + Utf8ArrayToStr(ArrayView);//String.fromCharCode.apply(null, ArrayView);


			let parts = stringView.split(new RegExp(boundary));
			let fields = {};
			let files = [];
			// First part is a preamble, last part is closing '--'
			for (let i = 1; i < parts.length ; i++) {
				const subparts = parts[i].split('\r\n\r\n');
				const headers = subparts[0].split('\r\n');
				let fieldName = '';
				let fileName = '';
				let contentType = '';
				
				for (let j = 1; j < headers.length; j++) {
					let headerFields = parseHeader(headers[j]);
					if (headerFields.name) {
						fieldName = headerFields.name;
					}
					if (headerFields.filename) {
						fileName = headerFields.filename;
					}
					if (headerFields.contentType) {
						contentType = headerFields.contentType;
					}
				}
			
				if(fileName) {
					files.push({
						fieldName,
						fileName,
						contentType,
						extension : (new Mime()).getExtension(contentType),
						buffer : Buffer.from(stringToArrayBuffer(subparts[1])),
					})
				}
				else
					fields[fieldName] =  subparts[1];

			}

			if(files.length)
				req.files = files;
			if(Object.keys(fields).length)
				req.body = fields;


		}
		next();
	}
}

