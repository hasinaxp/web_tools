# sp-wt
## web-toolkits
this is a simple light weight implementation of tools to help create a server based web application without using any 3rd party library, other than the core libraries provided by node.



## functionalities

- express like server architechture
- static routing
- middlewares like bodyparser.json bodyparser.urlencoded
- middleware for formdata
- middleware for cross-origin-access(cros)
- json-web-token
- handlebars like view engine
- web like fetch api for http requests
- Wrapper class for websocket protocol for realtime socket connections
- cookie parsing
- database driver for postgresql


## minimum node version
node 15

## javascript type
module

# documentation


## Server

- type 	: class
- usage	: create a web server
- module: modules/server.js

### description
> create an express like server using this class.
> inherits from **Router**. so all the functionalities of router is also applicable for server
### example 
```javascript
import Server from 'sp-wt/modules/server.js'
//create server object
let app = new Server();
//add routes (see router class for more)
app.get('/', (req, res) => {
	res.send("hello world");
});
//listen to port
app.listen(3000, () => { console.log('server listening at port 3000') });
```
### methods

#### server.set(name, value)
sets a **value** with the  key **name** that can be accsess from req.app.get(name)

#### server.get(name)
get a **value** set in the server

#### server.get(routeUrl, middleware1?, middleware2? ..., handler)
set **middlewares** and **handler** for **GET** requests on the **routeUrl** path
the order of the function determines which function is called before other one.
handler is called at the end. if **next()** is not called from the middleware the upocming middlewares and handler will not be called. 

see other available methods is Router section

#### *middleware*
a callback function with three arguments *req*, *res*, *next*
### example 
```javascript
function middleware (req, res, next) {
	if(isAuthenticated) // demo if condition add your own logic
		next()
	else
		res.json({error: 'not authenticated'})
}
```

#### *handler*
a callback function with two arguments *req* and *res*
### example :
```javascript
function handler (req, res) {
	let name = req.body.name;
	res.json({userName : name})
}
```
req is a modified **http.IncomingMessage** object which has several fields and methods on top of the standard ones 
- req.rawBody : Buffer containing raw data sent with request
- req.hasBodyData :boolean, true if there is any data sent with the request
- req.rawBodyLength : length of req.rawBody buffer in bytes 
- req.params :containing all the params in the url (i.g. '/path/:param1/:param2')
- req.ip :client ip
- req.port :client port
- req.param(field) :get the value of the param with **:field** placeholder
- req.get(field) :get the value of request header with key **field**
- req.is(type) : check if req is of content type **type**
- req.getCookies() : returns all coookies in the request as object

res is a modified **http.ServerResponse** object which has several methods on top of the standard ones
- res.redirect(path, statusCode?) : redirects request to the given **path**
-	res.send(data) :sends data as rensponse, data can be anything
- res.sendFile(filepath) :send the file mentioned in the filepath as response
-	res.status(code) : sets the code for the response statusCode
- res.header(name, value) :sets header with **name** as key for **value**
- res.type(t) : sets the correct mimetype t for for content-type header (e.g. res.type('json'))
-	res.contentType(t) : set content-type header to **t**
- res.json(object) : sends javascript object **object** as json as response
- res.setCookies(cookies) : set cookies for the response
	- **cookies** is a object containing names as key and values of the cookies
	- example: res.setCookies({status : 'good', age: 20})

- res.render(viewTemplateName, props): renders correspondent view template using RenderEngine with supplied props at serverside and sends as html response
	- default view templetes folder is './views/'
	- set view templetes folder using app.set('view folder', folderName)
	- see **RenderEngine** section for more details

#### server.createRouter()
instantiates a new **Router** object

#### server.createStaticRouter()
instantiates a new **StaticRouter** object


### server.listen(port, ...args)
listens to a given port, reuturns internal **http** server
function overloads-
- listen(port?: number, hostname?: string, backlog?: number, listeningListener?: () => void): this;
- listen(port?: number, hostname?: string, listeningListener?: () => void): this;
- listen(port?: number, backlog?: number, listeningListener?: () => void): this;
- listen(port?: number, listeningListener?: () => void): this;


## Router

- type 	: class
- usage	: create a router for server
- module: modules/router.js

### description
> create an express like router using this class.
> server itself is an router so all router methods are available for server

### example
```javascript
import Server from 'sp-wt/modules/server.js'
import Router from 'sp-wt/modules/router.js'
//create server object
let app = new Server();
//create a router object
let router = new Router();
//add all routes
router.post('/pokemon/:id', (req, res) => {

	res.json({
		params: req.params,
		body: req.body
	});
});

//use router for anime path, i.e. POST to /anime/pokemon/2
app.use('/anime', router);
```

### methods

#### router.use(middleware)
sets middleware for all routes in the router.
these middlewares are called first ,before the middlewares in the hendler mothods like get, post etc.
order of middleware is depends on declearation of use in code

#### router.use(routePath, router)
set another **router** object to handle all the subroutes in the **routePath**

#### router.all(routeUrl, middleware1?, middleware2? ..., handler)
set **middlewares** and **handler** for all kinds of requests(e.g. GET, POST etc.) on the **routeUrl** path

#### router.get(routeUrl, middleware1?, middleware2? ..., handler)
set **middlewares** and **handler** for **GET** requests on the **routeUrl** path

#### router.post(routeUrl, middleware1?, middleware2? ..., handler)
set **middlewares** and **handler** for **POST** requests on the **routeUrl** path

#### router.put(routeUrl, middleware1?, middleware2? ..., handler)
set **middlewares** and **handler** for **PUT** requests on the **routeUrl** path

#### router.delete(routeUrl, middleware1?, middleware2? ..., handler)
set **middlewares** and **handler** for **DELETE** requests on the **routeUrl** path

#### router.patch(routeUrl, middleware1?, middleware2? ..., handler)
set **middlewares** and **handler** for **PATH** requests on the **routeUrl** path



## StaticRouter (foldername)

- type 	: class
- usage	: serve a folder as router
- module: modules/staticRouter.js

### description
> serve files folder and all it's subfolders with same path relative to folder
> constructor takes path to the folder as argument
> should be used as a **Router**
### example
```javascript
import Server from 'sp-wt/modules/server.js'
import StaticRouter from 'sp-wt/modules/staticRouter.js'

//create server object
let app = new Server();
//given that all files you want to serve are present in public folder in same directory
//i.e. public/pages/about.html will be served at localhost:3000/pages/about.html
app.use('/', new StaticRouter(__dirname +'/public'))
//listen to port
app.listen(3000, () => { console.log('server listening at port 3000') });
```

## RenderEngine
an internal class for serverside renderring

#### example

> file structure
```
views/page.htm
app.js
```

> ./views/page.htm
```html
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Document</title>
</head>
<body>
	<h1>hello world</h1>
	<h2>{{this.name}}</h2>
	<ul>
		{{for (let p of this.pokemons) { }}
			<li>name: <b>{{p.name}}</b>, ability: <b>{{p.ability}}</b> </li>
		{{ } }}
	</ul>
	<div>
		<input type="text" id="msg"/>
		<button id="btn">Button</button>
	</div>
</body>
```
> ./app.js
```javascript
import Server from 'sp-wt/modules/server.js'
import StaticRouter from 'sp-wt/modules/staticRouter.js'

//create server object
let app = new Server();
//set the folder for view templates
app.set('view folder', './views')


// render page.htm template  at localhost:3000/
app.get('/', (req, res) => {
	console.log(process.env.DATABASE);
	res.render('page', {
		name: 'spandan mondal',
		pokemons: [
			{
				name: 'pikachu',
				type: 'electic',
				ability: 'static'
			},
			{
				name: 'charmender',
				type: 'fire',
				ability: 'blaze'
			},
			{
				name: 'ratatta',
				type: 'normal',
				ability: 'run away, guts, hustle'
			}
		]
	})
});
//listen to port
app.listen(3000, () => { console.log('server listening at port 3000') });
```

### method
> res.render(templateName, renderprops)

### Syntex

#### string interpolation of renderprops
use double curly braces to get access values of **renderprops**. props are acccessable under **this**

> {{ this.property }} 

## javascript evaluation
any valid javascript expression under {{ }} will be pre calcuated before rendering
> {{ 2 + 2 }} -> 4

## if-else statement
acts like normal if-else. javascript part should be in {{ }}

> {{ if (condition_1 ) { }}
>	< html to render if condition_1 is true >
> {{ } else if (condition_2) { }}
>	< html to render if condition_2 is true >
> {{ } else { }}
>	< html to render if condition_1 and condition_2 are false >
> {{ } }}

## for statement
acts like normal for loop. javascript part should be in {{ }}

> {{for (let i = 0; i < 10; i++ >) { }}
>  < print this html 10 times >
> {{ } }}

## switch case statement
same as if-else. just keep javascript part in {{ }}

## @include <templateName>
use this to include a template in another template. properties will be accessable from included templates too

### example
card.htm
```html
<div class="card">
	<h3>{{ c.title }}</h3>
	<p>{{ c.description }}</p>
</div>
```
page.htm
```html
<body>
	{{for (let c of this.cards ){ }}
		{{ @include <card> }}
	{{ } }}
</body>
```
javascript
```javascript
res.render('page', { cards : [
	{title: 'title 1', description: 'description 1'},
	{title: 'title 2', description: 'description 2'},
	{title: 'title 3', description: 'description 2'}
]})
```
## env 

- type 	: function
- usage	: set environment variables
- module: modules/env.js

### example
>.env
```
key1=value1
key2 = value2
key3 = "value3"
```
>javascript
```javascript
import env from '../modules/env.js';
//call to set environment variables
env();
console.log(process.env.key1);
```

## common middlewares
set of functions to add essential middlewares to server app
-	cros
- json
	- addtional options: inflate, limit, reviver, verify
- urlencoded
	- addtional options: inflate, limit, verify
- formdata
	-additional options: limit
### example
```javascript
import Server from '../modules/server.js';
import { json, urlencoded, formdata, cros } from '../modules/commonMiddlewares.js';

let app = new Server();
//enable cross origin requests
app.use(cros());
//parse json requests and put data object as req.body
app.use(json());
//parse urlencoded requests and put fields into req.body boject
app.use(urlencoded());
//parse multipart/formdata requests
// put text fields into req.body object
// put files into req.files array
// every object in req.files array contain 
//		fieldName : name of the input field,
// 		fileName : name of the uploaded file,
// 		contentType : mimetype of the uploaded file,
// 		extension : extension of the uploaded file,
// 		buffer : Buffer object containing binary data of the file 
app.use(formdata());
```

## JsonWebToken

- type 	: class
- usage	: create and vertify jwts
- module: modules/jsonWebToken.js

### description
> create and verrify json web tokens for authentication

### example
```javascript
import JWT from 'sp-wt/modules/jsonWebToken.js'

//instanciate jwt object
let jwt = new JWT();
//create jwt token
let token =  jwt.sign({user: 'ash', age: 10}, 'secret_of_ash')

let v = jwt.verify(token, 'secret_of_ash')
if(v) {
	const {user, age} = v;
}else {
	console.log('invalid token');
}
```
### methods

#### jwt.sign(payload, secret, options)
used to create jwt tokens
- payload : data to be encoded as jwt ( type: Object)
- secret : private key to encrypt data
- options : object containing additional options
	- algorithm : algorithm to encrypt. (supported:HS256, RS256)
	- expiresIn : time to expire (i.e. '10s', '2h')
	- subject
	-	audience
	- notBefore : time until which the token is not valid (i.e. '10s', '2h')
	- issuer

#### jwt.verify(token, secret)
used to verify a token. 
if the token is valid returns payload else returns false.


## WebSocket (httpServer)

- type 	: class
- usage	: use websocket api to make socket connection to client
- module: modules/webSocket.js

### description
> create and use websocket server for realtime socket connection with websocket api provided by client browser
> get **httpServer** from **app.httpServer** where app is an object of Server class

### example
```javascript
import Server from '../modules/server.js';
import WebSocket from '../modules/webSocket.js';

let app = new Server();

//create websocket instance
let ws = new WebSocket(app.httpServer);

//listen to client connection
ws.onConnect = (socket, sid) => {
	console.log('connected id: ' + sid );
	ws.send(socket, {
		message: 'connected to server' 
	});
};
ws.onTextMessage = (data, socket, sid) => {
	console.log(data);
}

app.listen(3000, () => { console.log('server listening at port 3000') });
```
### callbacks

#### webSocket.onConnect
callback that is called when client connects
> (socket, sid) => {}
**socket** represents the connection socket of the client. store the socket to use it to send message data to client.
**sid** represents unique uuid assigned to the client

#### webSocket.onClose
callback that is called when client disconnects
> (socket, sid) => {}
**socket** represents the connection socket of the client.
**sid** represents unique uuid assigned to the client

#### webSocket.onMessage
callback that is called when client sends a message
>(data, socket, sid) => {};
**data** contains the message as raw
**socket** represents the client socket. use it to identify client
**sid** represents unique uuid assigned to the client

#### webSocket.onTextMessage
callback that is called when client sends a message
>(data, socket, sid) => {};
**data** contains the message in text format
**socket** represents the client socket. use it to identify client
**sid** represents unique uuid assigned to the client

### methods

#### webSocket.send(socket, obj)
function to send message to client
**socket** prepersents client socket that you want to send data
**obj** represent the javascript object you want to send as json

#### webSocket.send(sid, obj)
function to send message to client
**sid** prepersents unique client uuid that you want to send data
**obj** represent the javascript object you want to send as json

#### webSocket.sendText(socket, text)
function to send message to client
**socket** prepersents client socket that you want to send data
**text** represent the string you want to send

#### webSocket.sendText(sid, text)
function to send message to client
**sid** prepersents unique client uuid that you want to send data
**text** represent the string you want to send

#### webSocket.closeConnection(socket)
close connection with client **socket**

#### webSocket.closeConnection(sid)
close connection with client with **sid** as unique id


## PostgreSqlDriver 

- type 	: class
- usage	: database access for postgresql
- module: modules/postgres.js

### description
>connect to postgresql sql database, execute queries, get results. can be used in both async and callback mode. connection and disconnection is innitiated automatically when you try to execute query.

### example :
```javascript
import PostgreSql from "../modules/postgres.js"


console.log("database test")
let pg = new PostgreSql({
    host: "localhost",
    user: "postgres",
    password: "spandan9733",
    database: "testdb"
});

async function main() {
	//databse query using callback
	pg.query("select * from items", (err, result) => {
		if(err)
			console.log(err);
		let row;
		//getting one row at a time
		while(row = result.fetch_assoc()) {
			console.log(row);
		}
	});

	//database query using async and arguments
    try {
		let res = await pg.query("select * from items where id = $1", [1]);
		console.log(res);
	} catch (e) {
		console.log(e);
	}
}

main();
```
### methods

#### pgDriver.query(sql, args?, callback?)
**sql** represents the sql query
**callback** represent a fucntion that is called when the query is executed. (optional)

returns a javascript promise containing **result** object

the callback function looks like
> (err, result) => {}
##### err
if there is error in execution err will contain the error, else it will be null for successful query and the **result** object will contain output of the query

##### result
contains different fields and method
- num_rows : number of rows in the output
- fields : titles of the attribute present in a row
- types : array containing datatypes of the attributes
- rows  : array containing all rows
	- all values in a row oject are in string format with keys as attribute
- status : not null for successful query
- fetch_assoc(): function that returns one row each time called
	- every call will return next row
	- will return null when all rows are returned
	- datavalues in row are in proper datatype format as mentioned in types(i.e. int will be in Number format)
- fetch() : return array containing all correctly formatted rows. 


#### pgDriver.prepare(sqlPrepareStatement)
returns an prepareStatement object with functions to make secure sql queries
- bind_params(format, ...args) :function to bind parameters to the statement  
	-	format : stiring representing datatypes of other argulments in order. (i.e. "iss")
		- i : integer parameter
		- s : string parameter
		- d : double (floating point) paramenter
	-args: paramenters to replace ? in **sqlPrepareStatement**
- execute() : asynchronous function which returns **result** object

### callbacks

#### pgDriver.onConnect
callback for successful connection to database

#### pgDriver.onDisconnect
callback for successfully disconnecting from database

#### pgDriver.onError
callback for error handling, has one argument containing error


## fetch (url, options)
- type 	: function
- usage	: Make http requests 
- module: modules/fetch.js

serverside implementation of fetch function to make http calls. By default it makes GET request.

**options** 
-	method : method of request (i.e. 'GET', 'POST', etc)
- headers : any headers you want to add to your request, contained within this object.
- body : Any body that you want to add to your request
