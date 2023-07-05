import crypto from 'crypto';

/*
TODO:
1. better handling of storing the sockets
2. Handling extensions
3. Handling protocols


*/

export default class WebSocket {

	constructor(httpserver) {
		this.server = httpserver;
		this.sockets = {};

		this.onMessage = (data, socket, sid) => { };
		this.onTextMessage = (data, socket, sid) => { };

		this.onConnect = (socket, sid) => { };
		this.onCose = (socket, sid) => { };


		this.lastError = '';
		this.server.on('upgrade', (req, socket, head) => {
			if (!req.headers.hasOwnProperty('sec-websocket-key')) {
				this.lastError = 'sec-websocket-key header missing';
				return;
			}
			let key = req.headers['sec-websocket-key'];
			const RE_KEY = /^[+/0-9A-Za-z]{22}==$/
			if (!RE_KEY.test(key) || req.headers.upgrade.toLowerCase() !== 'websocket') {
				this.lastError = "not proper web socket request";
				return;
			}
			const secWebSocketProtocol = req.headers['sec-websocket-protocol'];
			const secWebSocketExtensions = req.headers['sec-websocket-extensions'];

			const uid = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
			const digest = crypto.createHash('sha1').update(key + uid).digest('base64');


			let handshake = [
				'HTTP/1.1 101 Switching Protocols',
				'Upgrade: websocket',
				'Connection: Upgrade',
				`Sec-WebSocket-Accept: ${digest}`
			];
			handshake = handshake.join('\r\n');
			handshake += '\r\n\r\n';
			let sid = `${crypto.randomUUID()}`;
			this.sockets[sid] = socket;
			socket.write(handshake);

			this.onConnect(socket,sid);

			socket.on("data", (data) => {
				let d = this.parseMessage(data);
				if(d === null) {
					this.onCose(socket);
					return;
				}
				this.onMessage(d);
				this.onTextMessage(Buffer.from(d).toString('utf8'));
			});
			socket.on("error", (data) => {
				console.log('error');

			});
		});
	}
	parseMessage(buffer) {
		const firstByte = buffer.readUInt8(0);
		const isFinalFrame = Boolean((firstByte >>> 7) & 0x1);
		const reserverd1 = Boolean((firstByte >>> 6) & 0x1);
		const reserverd2 = Boolean((firstByte >>> 5) & 0x1);
		const reserverd3 = Boolean((firstByte >>> 4) & 0x1);

		const opcode = firstByte & 0xF;

		if (opcode === 0x8)
			return null;
		if (opcode !== 0x1)
			return;

		const secondByte = buffer.readUInt8(1);
		let currentOffset = 2;


		const isMasked = Boolean((secondByte >>> 7) & 0x1);
		let maskingKey;
		if (isMasked) {
			maskingKey = buffer.readUInt32BE(currentOffset);
			currentOffset += 4;
		}
		let payloadLength = secondByte & 0x7F;

		if (payloadLength > 125) {
			if (payloadLength == 126) {
				payloadLength = buffer.readUInt16BE(currentOffset);
				currentOffset += 2;
			}
			else {
				const left = buffer.readUInt32BE(currentOffset);
				const right = buffer.readUInt32BE(currentOffset += 4);

				this.lastError = "very large payload";
				throw new Error('very large payload');
			}
		}
		const data = Buffer.alloc(payloadLength);
		if (isMasked) {
			for (let i = 0, j = 0; i < payloadLength; ++i, j = i % 4) {
				const shift = j === 3 ? 0 : (3 - j) << 3;
				const mask = (shift == 0 ? maskingKey : (maskingKey >>> shift)) & 0xFF;
				const sorce = buffer.readUInt8(currentOffset++);
				data.writeUInt8(mask ^ sorce, i);
			}
		}
		else {
			buffer.copy(data, 0, currentOffset++);
		}

		return data;

	}

	constructMessage(obj) {
		const json = JSON.stringify(obj);
		const jsonByteLength = Buffer.byteLength(json);
		const byteCount = jsonByteLength < 126 ? 0 : 2;
		const payloadLength = byteCount === 0 ? jsonByteLength : 126;
		const buffer = Buffer.alloc(2 + byteCount + jsonByteLength);

		buffer.writeUInt8(0b10000001, 0);
		buffer.writeUInt8(payloadLength, 1);

		let payloadOffset = 2;
		if (byteCount > 0) {
			buffer.writeUInt16BE(jsonByteLength, 2);
			payloadOffset += byteCount;
		}
		buffer.write(json, payloadOffset);
		return buffer;
	}

	constructTextMessage(text) {
		const textLength = Buffer.byteLength(text);
		const byteCount = textLength < 126 ? 0 : 2;
		const payloadLength = byteCount === 0 ? textLength : 126;
		const buffer = Buffer.alloc(2 + byteCount + textLength);

		buffer.writeUInt8(0b10000001, 0);
		buffer.writeUInt8(payloadLength, 1);

		let payloadOffset = 2;
		if (byteCount > 0) {
			buffer.writeUInt16BE(textLength, 2);
			payloadOffset += byteCount;
		}
		buffer.write(text, payloadOffset);
		return buffer;
	}

	send(socket, obj) {
		let clientSocket = socket;
		if (typeof (socket) === 'string')
			clientSocket = this.sockets[socket];
		try {
			clientSocket.write(this.constructMessage(obj));
		} catch (error) {
			this.lastError = error.message;
		}
	}

	sendText(socket, text) {
		let clientSocket = socket;
		if (typeof (socket) === 'string')
			clientSocket = this.sockets[socket];
		try {
			clientSocket.write(this.constructTextMessage(text));
		} catch (error) {
			this.lastError = error.message;
		}
	}

	closeConnection(socket) {

		let clientSocket = socket;
		if (typeof (socket) === 'string') {
			clientSocket = this.sockets[socket];
			delete this.sockets[socket];
		}
		clientSocket.end();
	}
};