import fs from 'fs';
import Router, {Route} from "./router.js";


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
		let route = new Route(path, 'GET', (req, res)=> {
			//TODO : revisite implementation
			res.send(file);
		})
		this.routes.push(route);
	}

	resolve(path, middlewares, req, res)
	{
		this.generateRoute(path);
		return super.resolve(path, middlewares, req, res);
	}


};