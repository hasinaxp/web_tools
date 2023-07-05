import crypto from 'crypto';
import { stringToMilliseconds } from './utils.js';


export default class JsonWebToken {
	constructor() {
		this.supportedAlgorithms = ['HS256', 'RS256'];
		this.lastError = "";
	}

	urlSafe(str) {
		return str.replace(/[=+/]/g, c => {
			switch (c) {
				case '=':
					return '';
				case '+':
					return '-';
				case '/':
					return '_';
			}
		});
	}


	sign(payload, secret, options) {
		let algorithm = this.supportedAlgorithms[0];

		if (options) {
			if (options.algorithm && (options.algorithm in this.supportedAlgorithms))
				algorithm = options.algorithm;
			if (options.expiresIn) {
				let t = stringToMilliseconds(options.expiresIn);
				payload.exp = Date.now() + t;
				payload.iat = Date.now();
			}
			if (options.notBefore) {
				let t = stringToMilliseconds(options.expiresIn);
				payload.nbf = Date.now() + t;
				payload.iat = Date.now();
			}
			if (options.subject) {
				payload.sub = options.subject;
			}
			if (options.issuer) {
				payload.iss = options.issuer;
			}
			if (options.audience) {
				payload.aud = options.audience;
			}

		}

		let header = {
			alg: algorithm,
			typ: 'JWT'
		};

		const headerStr = JSON.stringify(header);
		const headerBase64 = this.urlSafe(Buffer.from(headerStr).toString('base64'));
		const payloadStr = JSON.stringify(payload);
		const payloadBase64 = this.urlSafe(Buffer.from(payloadStr).toString('base64'));

		let signature;
		switch (algorithm) {
			case 'HS256':
				signature = crypto.createHmac('sha256', secret);
				signature.update(headerBase64 + '.' + payloadBase64);
				signature = this.urlSafe(signature.digest('base64'));
				break;
			case 'RS256':
				signature = crypto.createSign('RSA-SHA256');
				signature.update(headerBase64 + '.' + payloadBase64)
				signature = this.urlSafe(signature.sign(secret, 'base64'));
				break;
		}

		return `${headerBase64}.${payloadBase64}.${signature}`;

	}

	verify(token, secret) {

		let parts = token.split('.');

		if (parts.length !== 3) {
			this.lastError = "insufficient segments in token";
			return false;
		}

		const headerBase64 = parts[0];
		const payloadBase64 = parts[1];
		const signature = parts[2];

		const header = JSON.parse(Buffer.from(headerBase64, 'base64').toString('utf8'));
		const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));



		if (!header.hasOwnProperty('typ')) {
			this.lastError = "type field missing from header";
			return false;
		}
		if (!header.hasOwnProperty('alg')) {
			this.lastError = "algorithm field missing from header";
			return false;
		}
		if (header.typ !== 'JWT') {
			this.lastError = "type is not jwt";
			return false;
		}
		if (payload.exp && payload.exp < Date.now()) {
			this.lastError = "token already expired";
			return false;
		}
		if (payload.nbf && payload.nbf < Date.now()) {
			this.lastError = "token not valid yet";
			return false;
		}

		let algorithm = header.alg;

		let result = false;

		switch (algorithm) {
			case 'HS256':
				let signature2 = crypto.createHmac('sha256', secret);
				signature2.update(headerBase64 + '.' + payloadBase64);
				signature2 = this.urlSafe(signature2.digest('base64'));
				if (signature2 === signature)
					result = payload;
				break;
			case 'RS256':
				let v = crypto.createVerify('RSA-SHA256');
				v.update(headerBase64 + '.' + payloadBase64);
				if (v.verify(secret, signature, 'base64'))
					result = payload;
				break;

			default:
				break;
		}

		if (!result) {
			this.lastError = "signature not matching";
		}

		return result;

	}

};