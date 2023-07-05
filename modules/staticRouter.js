import fs from 'fs';
import Router, {Route} from "./router.js";
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { count } from 'console';


export default class StaticRouter extends Router {

	constructor(folderPath)
	{
		super();
		this.folderPath  = folderPath;

	}

	generateRoute(path)
	{
		let p = this.folderPath + '/' + path;
		this.routes = [];
		if(!fs.existsSync(p)) {
			return false;
		}
		if(fs.statSync(p).isDirectory()) {
			if(fs.existsSync(p + '/index.html')) {
				p = p + '/index.html';
			}
			else if (fs.existsSync(p + '/index.htm')) {
				p = p + '/index.htm';
			}
			else if (fs.existsSync(p + '/index.js')) {
				p = p + '/index.js';
			}
			else {
				return;
			}
		}
		let file = fs.readFileSync(p);
		
		
		return file;
	}

	resolve(path, middlewares, req, res)
	{
		try {
			let file = this.generateRoute(path);
		if(file)
			res.send(file);
		
	}catch(e) {

	}
		
		res.end();
	}


};