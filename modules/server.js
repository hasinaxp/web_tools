import http from "http";
import url from "url";
import path from "path";

import Router from "./router.js";
import StaticRouter from './staticRouter.js'
import configureResponseMethods from "./responseMethods.js"
import configureRequestMethods from "./requestMethods.js";
import configureCookieMethods from "./cookies.js";
import RenderEngine from "./renderEngine.js";



export function CurrentFileName() {
    return url.fileURLToPath(import.meta.url);
}

export function CurrentDirName() {
    return path.dirname(url.fileURLToPath(import.meta.url));
}


export default class Server extends Router
{
	
	constructor() {
		super();
		this.port = null;
		this.dataChunks = [];


		this.config = {
			'view folder': './views/',
			'view engine': 'renderEngine',
			'render mode': ''
		}

		this.renderFunction = (config, view, props) => {
			if(config['view engine'] == 'renderEngine') {
				let engine;
				if(config['render mode'] === 'index')
					engine = new RenderEngine(config['view folder'], `${config['view folder']}/index.htm`);
				else
					engine = new RenderEngine(config['view folder']);
				return engine.render(view, props, {config});
			}
		}

		this.httpServer = http.createServer((req, res) => {
			req.app = this;
			//adding methods to response object
			configureResponseMethods(res);
			res.render = (view, props) =>{
				let markup = this.renderFunction(this.config, view, props);
				res.contentType('text/html');
				res.send(markup);
				res.end();
			}
			res.redirect = (...args) => {
				res.statusCode = 301;
				let newPath = args[0];
				if(args.length === 2) {
					res.statusCode = args[0];
					newPath = args[1];
				}
				this.resolve(newPath);
			}
			//cookie methods
			configureCookieMethods(req, res);
			//prepare request data
			this.dataChunks = [];
			req.on('data', (chunk) => {
				this.dataChunks.push(chunk);
			}).on('end', ()=> {
				//adding methods to request object
				configureRequestMethods(req);

				//adding fields tp request object
				req.params = [];
				req.rawBody = Buffer.concat(this.dataChunks);
				req.hasBodyData = false;
				if(req.headers.hasOwnProperty('content-length') && req.headers['content-length'] !== 0) {
					req.hasBodyData = true;
					req.rawBodyLength =  req.headers['content-length'];
				}

				
				let parsedUrl = url.parse(req.url, true);
				req.query = parsedUrl.query;
				req.baseUrl = parsedUrl.pathname;
				req.originalUrl = parsedUrl;
				req.ip = req.socket.remoteAddress;
				req.port = req.socket.remotePort;
				
				//handle request
				this.resolve(parsedUrl.pathname, [], req, res);
				
			});
		
		});
	}

	setRenderFunction(func) {
		this.renderFunction = func(this.config);
	}

	
	set(name, value) {
		this.config[name] = value;
	}
	
	get(name) {
		if(arguments.length === 1)
			return this.config[name];
		else
		{
			super.get(...arguments)
		}
	}

	createRouter() {
		return new Router();
	}

	 createStaticRouter(path) {
		return new StaticRouter(path);
	}

	listen(port, ...args) {
		this.port = port;
		this.httpServer.listen(port ,...args);
		return this.httpServer
	}


};
