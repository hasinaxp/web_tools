import http from "http";
import url from "url";

import Router from "./router.js";
import configureResponseMethods from "./responseMethods.js"
import configureRequestMethods from "./requestMethods.js";
import RenderEngine from "./renderEngine.js";



export default class Server extends Router
{
	constructor() {
		super();
		this.port = null;
		this.dataChunks = [];


		this.config = {
			'view folder': './views/',
			'view engine': 'renderEngine'
		}

		this.renderFunction = (config, view, props) => {
			if(config['view engine'] == 'renderEngine') {
				let engine = new RenderEngine(config['view folder']);
				return engine.render(view, props);
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

			
				//console.log(req);
				//console.log(req.socket.readableEncoding);
				
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


	set(option, value) {
		this.config[option] = value;
	}

	listen(port, ...args) {
		this.port = port;
		this.httpServer.listen(port ,...args);
	}
	

};