import net from 'net';
import crypto from 'crypto'

export default class PostgreSql {
	db = null;
	constructor(connectionConfig) {
        this.connectionConfig = connectionConfig
		this.socket = new net.Socket();
		this.config = {};
		this.data = null;
		this.queries = [];
		this.shouldThrowError = false;
		this.isReadyForQuery = true;
		this.isConnected = false;
		this.datatypeCodes = {
			16: 'bool',
			17: 'bytea',
			18: 'tinyint',
			21: 'smallint',
			22: 'mediumint',
			23: 'int',
			20: 'bigint',
			700: 'float',
			701: 'double',
			25: 'text',
			1042: 'char(n)',
			1043: 'varchar(n)',
			1082: 'date',
			1083: 'time',
			1114: 'timestamp',
			2950: 'uuid',
			114: 'json',
			3802 : 'jsonb',
		}
		this.callback = () => { };
		this.results = {
			fields: [],
			types: [],
			rows: [],
			status: null,
			num_rows : 0,
			ci : 0,
			fetch_assoc : function () {
				if(this.ci < this.num_rows) {
					let row = this.rows[this.ci++];
					let i = 0;
					for(let key in row) {
						if(this.types[i].match('int'))
							row[key] = Math.floor(Number(row[key]));
						if(this.types[i].match('float') || this.types[i].match('double'))
							row[key] = Number(row[key]);
						if(this.types[i] == 'json') {
							row[key] = JSON.parse(row[key]);
						}
						i++;
					}
					return row;
				}
				return null;
			},
			fetch : function() {
				let rows = [];
				for(let row of this.rows) {
					let i = 0;
					for(let key in row) {
						if(this.types[i].match('int'))
							row[key] = Math.floor(Number(row[key]));
						if(this.types[i].match('float') || this.types[i].match('double'))
							row[key] = Number(row[key]);
						if(this.types[i] == 'json') {
							row[key] = JSON.parse(row[key]);
						}
						i++;
					}
					rows.push(row);
				}
				return rows;
			}
		}
		this.onConnect = () => { };
		this.onDisconnect = () => { };
		this.onError = (err) => { };
		this.onConnectCb = () => {};
		this.onErrorCb = () => {};

		this.socket.on("connect", err => {
			if (err)
				this.onError(err);
			this.onConnect();
			this.startConnection();
			
		});
		this.socket.on("error", err => {
			this.onError(err);
			this.onErrorCb(this);
		});
		this.socket.on("data", (data) => {
			this._parse(data);
		})
		this.socket.on("readyForQuery", () => {
            console.log("called")
            if(this.onConnectCb) {
                this.onConnectCb(this);
                this.onConnectCb = null;
            }
			if (this.queries.length) {
				this.isReadyForQuery = false;
				let query = this.queries.shift();
				this.socket.write(query.buffer);
				this.callback = query.cb;
			} else {
				this.isReadyForQuery = true;
			}
		})


	}
	connect(config, callback) {
		return new Promise((resolve, reject) => {
			if (!config.port)
				config.port = 5432;

			if (!config.host)
				reject({ err: `config.host must be provded` });

			if (!config.database)
				reject({ err: `config.database must be provded` });

			if (!config.user)
				reject({ err: `config.user must be provded` });

			if (!config.password)
				reject({ err: `config.password must be provded` });

			this.config = config;

			this.socket.connect(config.port, config.host, () => {
				PostgreSql.db = this;
				this.isConnected = true;
				if(callback)
					this.onConnectCb = callback;
                else
					this.onConnectCb = resolve;
			});

		});
	}

	disconnect() {
		const buffer = Buffer.alloc(5);
		buffer.write('X');
		buffer.writeInt32BE(4, 1);
		this.socket.end(buffer, () => {
			this.onDisconnect();
		});
	}
	startConnection() {
		const user = this.config.user;
		const database = this.config.database;

		const params = `user\0${user}\0database\0${database}\0\0`;
		const buffer = Buffer.alloc(8 + params.length);
		let offset = 0;
		buffer.writeInt32BE(buffer.length, offset);
		offset += 4;
		//protocol
		buffer.writeInt32BE(196608, offset);
		offset += 4;
		buffer.write(params, offset);

		this.socket.write(buffer);

	}
	_parse(data) {
		
		this.data = data;
		let type, length, offset = 0;
		do {
			type = String.fromCharCode(data[offset++]);
		length = data.readInt32BE(offset);
			offset += 4;
			switch (type) {
				case 'R':
					this._processPassword(offset, length);
					break;
				case 'E':
					this._processError(offset, length);
					break;
				case 'Z':
					this.isReadyForQuery = true;
					this.socket.emit('readyForQuery');
					break;
				case 'T':
					this._processFields(offset);
					break;
				case 'D':
					this._processRow(offset);
					break;
				case 'C':
					const i = data.indexOf(0, offset);
					this.results.status = data.toString('utf8', offset, i);
					this.results.num_rows = this.results.rows.length;
					this.isReadyForQuery = true;
					this.callback(null, this.results);
					
					break;
				default:
					break;
			}
			offset += (length - 4)
		} while (offset < data.length);
	}

	_processPassword(offset, rLength) {
		let start = offset;
		const passwordType = this.data.readInt32BE(start);
		start += 4;
		if (passwordType === 0) {
			
			return;
		}
		else if (passwordType === 5) {
			const salt = this.data.slice(start, start + 4);
			let hash = crypto.createHash('md5');
			hash.update(this.config.password + this.config.user, 'utf8');
			hash = hash.digest('hex');
			const b = Buffer.concat([Buffer.from(hash), salt]);
			hash = crypto.createHash('md5');
			hash.update(b, 'utf8');
			hash = 'md5' + hash.digest('hex');

			const length = 5 + hash.length;
			const buffer = Buffer.alloc(1 + length);
			buffer.write('P');
			buffer.writeInt32BE(length, 1);
			buffer.write(hash + '\0', 5);
			this.socket.write(buffer);
			

		}
		else if (passwordType === 10) {
		
			this.nonce = crypto.randomBytes(18).toString('base64');
			let resp =  'n,,n=*,r=' + this.nonce;
			let mechanism = 'SCRAM-SHA-256';
			const length = 5 + resp.length + 4 + mechanism.length;
			const buffer = Buffer.alloc(1 + length);
			buffer.writeInt8(0x70);
			buffer.writeInt32BE(length, 1);
			buffer.write(mechanism + '\0', 5);
			buffer.writeInt32BE(resp.length, 5 + mechanism.length + 1);
			buffer.write(resp , 10 + mechanism.length);
			this.socket.write(buffer);
		}
		else if (passwordType === 11) {
			let sr = this.data.slice(start, start + rLength - 8);
			let sv = this.saslPairs(sr);

			let salt = sv['s'];
			let rounds = parseInt(sv['i'], 10);
			let nonce = sv['r'];

			let sb = Buffer.from(salt, 'base64');

			let sp = this.Hi(this.config.password, sb, rounds);
			let ck = this.hmacSha256(sp, 'Client Key');
			let sk = this.sha256(ck);

			let cm1 =  'n=*,r=' + this.nonce;
			let cm2 = `r=${nonce},s=${salt},i=${rounds}`;
			let cm3 = `c=biws,r=${nonce}`;
			let authMsg = `${cm1},${cm2},${cm3}`;
			let cs = this.hmacSha256(sk, authMsg)
			let cpb = this.xorBuffers(ck, cs);
			let cp = cpb.toString('base64');
			let serverKey = this.hmacSha256(sp, 'Server Key');
			let ssb = this.hmacSha256(serverKey, authMsg);
			let resp = `${cm3},p=${cp}`

			const length = 4 + resp.length;
			const buffer = Buffer.alloc(length +1);
			buffer.writeInt8(0x70);
			buffer.writeInt32BE(length, 1);
			buffer.write(resp, 5);
			this.socket.write(buffer);
		}
		else if (passwordType === 12) {
			let sv = this.data.slice(start, start + rLength - 8);
		}
	}

	saslPairs(sr) {
		sr = sr.toString();
		let items = sr.split(',');
		let pairs = {};
		for(let x of items) {
			pairs[x[0]] = x.substring(2);
		}
		return pairs;
	}
	
 xorBuffers(a, b) {
  if (!Buffer.isBuffer(a)) {
    throw new TypeError('first argument must be a Buffer')
  }
  if (!Buffer.isBuffer(b)) {
    throw new TypeError('second argument must be a Buffer')
  }
  if (a.length !== b.length) {
    throw new Error('Buffer lengths must match')
  }
  if (a.length === 0) {
    throw new Error('Buffers cannot be empty')
  }
  return Buffer.from(a.map((_, i) => a[i] ^ b[i]))
}

sha256(text) {
  return crypto.createHash('sha256').update(text).digest()
}

hmacSha256(key, msg) {
  return crypto.createHmac('sha256', key).update(msg).digest()
}

Hi(password, saltBytes, iterations) {
  var ui1 = this.hmacSha256(password, Buffer.concat([saltBytes, Buffer.from([0, 0, 0, 1])]))
  var ui = ui1
  for (var i = 0; i < iterations - 1; i++) {
    ui1 = this.hmacSha256(password, ui1)
    ui = this.xorBuffers(ui, ui1)
  }

  return ui
}

	_processError(offset,length) {
		let start = offset;
		let err = {};

		const errFields = {
			"C": "code",
			"M": "message",
			"S": "severity"
		};
		while (start < length) {
			let fieldType = String.fromCharCode(this.data[start++]);
			if (fieldType == "0")
				continue;
			let end = this.data.indexOf(0, start);
			let field = this.data.toString('utf8', start, end);
			let type = errFields[fieldType];
			if (type)
				err[type] = field;
			start = end + 1;
		}
		if (err.severity === "ERROR" || err.severity === "FATAL") {
			this.callback(err);
			if(this.shouldThrowError)
				throw EvalError(err);
		}
	}
	_processFields(offset) {
		this.results.fields = [];
		let start = offset;
		const fieldCount = this.data.readInt16BE(start);
		start += 2;
		if (fieldCount === 0)
			return;
		for (let i = 0; i < fieldCount; i++) {
			let end = this.data.indexOf(0, start);
			let field = this.data.toString('utf8', start, end);
			this.results.fields.push(field);
			start = end + 1;
			start += 6;
			let idType = this.data.readInt32BE(start);
			this.results.types.push(this.datatypeCodes[idType]);
			start += 12;
		}
	}
	_processRow(offset) {
		let start = offset;
		let row = {};
		const fieldCount = this.data.readInt16BE(start);
		start += 2;
		if (fieldCount === 0)
			return;
		for (let i = 0; i < fieldCount; i++) {
			let columnName = this.results.fields[i];
			let length = this.data.readInt32BE(start);
			start += 4;
			if (length === -1) {
				row[columnName] = null;
			} else {
				let value = this.data.toString("utf8", start, start + length);
				row[columnName] = value;
				start += length;
			}
		}
		this.results.rows.push(row);
	}

	_query(sql, cb = null) {
	
		if(!cb) {
			return new Promise((resolve,reject) => {
				this._query(sql, (err, data) => {
					if(err)
						reject(err);
					resolve(data)
				})
			});
		}

		const length = 5 + sql.length;
		const buffer = Buffer.alloc(length + 1);
		buffer.write('Q');
		buffer.writeInt32BE(length, 1);
		buffer.write(sql + '\0', 5);


		if (this.isReadyForQuery && this.queries.length === 0) {
			this.isReadyForQuery = false;
			this.results.rows = [];
			this.results.fields = [];
			this.results.types = [];
			this.results.status = null;
			this.results.num_rows = 0;
			this.results.ci = 0;
			this.queries.push({
				buffer,
				cb
			})
			this.socket.emit('readyForQuery');
		}
	}

    query(sql, args, cb) {
        
        if(!args)
            args = []
        if(!cb) return new Promise((resolve, reject) => {
            this.query(sql, args, (err, data) => {
                if(err)
                    reject(err);
                resolve(data)
            })
        });
        sql = sql.replace(/\$([0-9]+)/gm, (s,v) => {
     
            let val = args[Number(v)];
            console.log(typeof val)
            if(typeof val == 'number')
            {
                return val;
            }
            else if (typeof val == 'string')
            {
                val = `"${val.replace(/[\\$'"]/g, "\\$&")}"`
                return val;
            }
        })
        if(sql[sql.length - 1] !== ';')
            sql+= ';'
        if(!this.connectionConfig){
            cb('no connection cred provided');
            return;
        }
        this.connect(this.connectionConfig, (db) => {
            console.log(sql)
            db._query(sql, cb);
            this.disconnect();
        })
    }

	prepare(statement) {
		return {
			statement,
			driver : this,
			bind_params : function(...args) {

				if(typeof args[0] !== 'string')
					throw EvalError('first argument must be declearation string');
				if(args.length < args[0].length + 1)
					throw EvalError('insufficient arguments');

				let i = 1;
				this.statement = this.statement.replace(/(=\?|= +\?|\?)/gm, (s,v) => {
					if(args[0][i -1] == 's')
						return	`${v === '?' ? '': '='}'${args[i++].replace(/['"]+/g, '')}'`;
					else if (args[0][i -1] == 'i') {
						if(typeof args[i] === 'string')
							return	`${v === '?' ? '': '='}${Math.floor(Number(args[i++].replace(/['"]+/g, '')))}`;
						else
							return `${v === '?' ? '': '='}${Math.floor(args[i++])}`;
					}
					else if (args[0][i -1] == 'd') {
						if(typeof args[i] === 'string')
							return	`${v === '?' ? '': '='}${Number(args[i++].replace(/['"]+/g, ''))}`;
						else
							return `${v === '?' ? '': '='}${args[i++]}`
					}
					
				});
				return this;
			},
			execute : async function() {
				let res = await this.driver._query(this.statement);
				return res;
			}
		}
	}


}
