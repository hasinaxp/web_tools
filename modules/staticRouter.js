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
		this.routes = [];
		if(!fs.existsSync(this.folderPath + '/' + path)) {
			return false;
		}
		let file = fs.readFileSync(path);
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