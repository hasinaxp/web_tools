import PostgreSqlDriver from "../modules/postgreSqlDriver.js";

const pgDriver = new PostgreSqlDriver();
const config = {
	host: "localhost",
	port: 5432,
	user: "postgres",
	password: "spandan9733",
	database: "testdb"
}

pgDriver.onConnect = () => {
	console.log('connetced to database');
}


async function main() {
	let db = await pgDriver.connect(config);
	try {
		let res = db.prepare("select * from items where id = ?");
		res.bind_params('i', 1);
		console.log(res.statement);
		res = await res.execute();
		console.log(res);
	} catch (e) {
		console.log(e);
	}
}

main();