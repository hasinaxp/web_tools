import crypto from 'crypto';

let str = 'happy.dog';
let salt = crypto.randomBytes(128).toString('hex');
let hash = crypto.pbkdf2Sync(str, salt, 9865, 256, `sha512`).toString('hex');
let val = `${salt}${hash}`

console.log(val);