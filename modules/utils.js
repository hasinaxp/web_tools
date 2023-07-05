import crypto from 'crypto';


export function stringToBytes(str) {
	str = String(str).toLowerCase();
	str = str.replace(' ', '');

	let num = 0;
	if (str.includes('kb')) {
		num = Number(str.substring(0, str.indexOf('kb')));
		num *= 1024;
	}
	else if (str.includes('mb')) {
		num = Number(str.substring(0, str.indexOf('mb')));
		num *= 1024 * 1024;
	}
	else {
		num = Number(str);
	}
	return Math.floor(num);
}

export function stringToMilliseconds(str) {
	str = String(str).toLowerCase();
	str = str.replace(' ', '');
	let num = 0;
	if (str.includes('s')) {
		num = Number(str.substring(0, str.indexOf('s')));
		number *= 1000;
	}
	else if (str.includes('m')) {
		num = Number(str.substring(0, str.indexOf('m')));
		num *= 60 * 1000;
	}
	else if (str.includes('h')) {
		num = Number(str.substring(0, str.indexOf('h')));
		num *= 3600 * 1000;
	}
	else if (str.includes('hrs')) {
		num = Number(str.substring(0, str.indexOf('hrs')));
		num *= 3600 * 1000;
	}
	else if (str.includes('d')) {
		num = Number(str.substring(0, str.indexOf('d')));
		num *= 24 * 3600 * 1000;
	}
	else if (str.includes('days')) {
		num = Number(str.substring(0, str.indexOf('days')));
		num *= 24 * 3600 * 1000;
	}
	else if (str.includes('y')) {
		num = Number(str.substring(0, str.indexOf('y')));
		num *= 365 * 3600 * 1000;
	}
	else {
		num = Number(str);
	}
	return Math.floor(num);

}

export function stringToArrayBuffer(str) {
	let idx, len = str.length, arr = new Array(len);
	for (idx = 0; idx < len; ++idx) {
		arr[idx] = str.charCodeAt(idx) & 0xFF;
	}
	return new Uint8Array(arr).buffer;
}


export function hash(str) {
	let salt = crypto.randomBytes(128).toString('hex');
	let hash = crypto.pbkdf2Sync(str, salt, 9865, 256, `sha512`).toString('hex');
	return { hash, salt };
}

export function verifyHash(str, hash, salt) {
	let hash2 = crypto.pbkdf2Sync(str, salt, 9865, 256, `sha512`).toString('hex');
	return hash2 === hash;
}

export function generateRandomString(length = 16) {
	let result = '';
	let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

export function uuid() {
	return crypto.randomUUID()
}
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function flattenArray (array, result) {
  for (var i = 0; i < array.length; i++) {
    var value = array[i]

    if (Array.isArray(value)) {
      flattenForever(value, result)
    } else {
      result.push(value)
    }
  }

  return result
}
