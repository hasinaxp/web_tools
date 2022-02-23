import fs from 'fs';
import crypto from 'crypto';
import Server from '../modules/server.js';
import Router from '../modules/router.js';
import { json, urlencoded, formdata } from '../modules/commonMiddlewares.js'
import JsonWebToken from '../modules/jsonWebToken.js'
import WebSocket from '../modules/webSocket.js'

let app = new Server();

app.use(json());
app.use(urlencoded());
app.use(formdata());

app.get('/', (req, res) => {
	res.render('apple', {
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
app.get('/itan', (req, res) => {
	res.send("I am itan");
});

app.post('/', (req, res) => {

	let payload = {
		name: 'the great spandan mondal'
	}
	let jwt = new JsonWebToken();
	let token = jwt.sign(payload, 'appletree');

	let verified = jwt.verify(token, 'appletree');

	res.status(201).json({
		message: 'working fine',
		token,
		verified
	})
})


app.get('/socket', (req, res) => {
	//console.log(req);
	console.log('endpoint');
	res.send('hello world');
});


let router = new Router();

router.post('/pokemon/:id', (req, res) => {
	res.json({
		params: req.params,
		body: req.body
	});
});

app.use('/anime', router);

let ws = new WebSocket(app.httpServer);
ws.onConnect = socket => {
	console.log('connected');
	ws.send(socket, {
		message: 'connected to server' 
	});
};
ws.onTextMessage = (data, socket) => {
	console.log(data);
}





app.listen(4000, '0.0.0.0', () => { console.log('server listening') });

