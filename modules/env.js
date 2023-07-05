import fs from 'fs';


export default function config(filename) {
	if(!filename)
		filename = './.env';
	let content = fs.readFileSync(filename, 'utf8');
	let lines = content.split('\n');
	for(let line of lines) {
		let i = line.indexOf('=');
		let key = line.substring(0, i).trim();
		let value = line.substring(i+1).trim();
		if(value[0] === value[value.length - 1] && (value[0] === `'` || value[0] === `"` ))
			value = value.substring(1, value.length - 1);
		if(!isNaN(value))
			value = Number(value);
		process.env[key] = value;
	}
}