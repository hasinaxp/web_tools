import {cros, json, urlencoded, formdata} from './modules/commonMiddlewares.js';
import Cookies from './modules/cookies.js'
import Server from './modules/server.js';
import StaticRouter from './modules/staticRouter.js';
import fetch from './modules/fetch.js';
import JsonWebToken from './modules/jsonWebToken.js';
import Router from './modules/router.js';
import WebSocket from './modules/webSocket.js';
import PostgreSql from './modules/postgres.js';
import {hash, verifyHash, generateRandomString, uuid} from "./modules/utils.js";
import Env from './modules/env.js';


const Package = {
	Middlewares : {cros, json, urlencoded, formdata},
	Cookies,
	Server,
	StaticRouter,
	fetch,JsonWebToken,
	Router,
	WebSocket,
    Env,
	generateRandomString,
	hash,
	verifyHash,
	uuid,

};

export default Package;
