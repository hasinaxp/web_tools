import Mime from "./mime.js";
import fs from 'fs';


export function send(data) {
	this.write(data);
	this.end();
	return this;
}

export function sendFile(filepath) {
	if(fs.existsSync(filepath)) {
		let file = fs.readFileSync(filepath);
		this.write(file);
		this.end();
	}
	else {
		this.end();
	}
}

export function status(code)
{
	if(typeof(code) === 'number') {
		this.statusCode = code;
	}
	return this;
}

export function header(name, value) {
	this.setHeader(String(name), String(value));
	return this;
}

export function type(t){
	
	const mime = new Mime();
	this.setHeader('Content-Type', mime.getType(t));
	return this;
}

export function contentType(t){
	
	this.setHeader('Content-Type', t );
	return this;
}

export function json(obj)
{
	let json = JSON.stringify(obj);
	this.setHeader('Content-Type', 'application/json');
	this.write(json);
	this.end();
	return this;
}

export default function configureResponseMethods(res)
{
	res.send = send;
	res.sendFile = sendFile;
	res.status = status;
	res.header = header;
	res.type = type;
	res.contentType = contentType;
	res.json = json;
	
}