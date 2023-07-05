

export class Route {
	
	constructor(path, method, handlerArray) {
		this.path = path;
		this.method = method;
		this.handlerArray = handlerArray;


		this.subpaths = this.path.split('/');
		this.subpaths.shift();

		this.params = {};

		for (let i = 0; i < this.subpaths.length; i++) {
			let sp = this.subpaths[i];
			if (sp[0] === ':') {
				this.params[sp.substring(1)] = i;
			}
		}
	}


	match(path) {
		let subpaths = path.split('/');
		subpaths.shift();
		if (this.subpaths.length > subpaths.length)
			return;
		for (let i = 0; i < this.subpaths.length; i++) {
			if (this.subpaths[i][0] !== ':') {
				if(this.subpaths[i] == '*')
					return true;
				if (subpaths[i] !== this.subpaths[i])
					return false;
			}
		}
		return true;
	}


	HandleRequest(path, middlewares, req, res) {
		
		//populate req.params if params are present
		if (Object.keys(this.params).length) {
			let subpaths = path.split('/');
			subpaths.shift();
			req.params = {};
			for(let p in this.params){
				req.params[p] = subpaths[this.params[p]];
			}
		}

		//handling request
		let handlers = [...middlewares, ...this.handlerArray];

		let hdr = (funcs, i = 0) =>{
			if(i == funcs.length - 1)
			{
				funcs[i](req, res);
				return;
			}
				let next = () => {
				hdr(funcs, i + 1);
			};
			funcs[i](req, res, next); 
		}
		hdr(handlers);

	}

}

export default class Router {
	
	constructor() {
		this.routes = [];
		this.routers = {};
		this.middlewares = [];
	}
	
	resolve(path, middlewares = [], req, res) {

		for (let routerpath in this.routers) {
			if (path.indexOf(routerpath) === 0) {
				if(this.routers[routerpath].resolve(path.substring(routerpath.length), [...middlewares, ...this.middlewares], req, res))
				return true;
			}
		}
		for (let route of this.routes) {
			if (route.match(path) && (route.method === req.method || route.method === 'ALL')) {
				route.HandleRequest(path, [...middlewares, ...this.middlewares], req, res);
				return true;
			}
		}

		return false;
	}

	
	use(...args) {
		if(args.length === 2)
		{
			if (args[1] instanceof Router)
			this.routers[args[0]] = args[1];
	
		}
		else if(args.length === 1)
		{
			this.middlewares.push(args[0]);
		}
	}
	
	all(path, ...args) {
		this.routes.push(new Route(path, 'ALL', args));
	}
	
	get(path, ...args) {
		this.routes.push(new Route(path, 'GET', args));
	}
	
	post(path, ...args) {
		this.routes.push(new Route(path, 'POST', args));
	}
	
	put(path, ...args) {
		this.routes.push(new Route(path, 'PUT', args));
	}
	
	delete(path, ...args) {
		this.routes.push(new Route(path, 'DELETE', args));
	}
	
	patch(path, ...args) {
		this.routes.push(new Route(path, 'PATCH', args));
	}
	
	options(path, ...args) {
		this.routes.push(new Route(path, 'PATCH', args));
	}

};
