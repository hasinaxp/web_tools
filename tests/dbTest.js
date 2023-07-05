import PostgreSql from "../modules/postgres.js"


console.log("database test")
let pg = new PostgreSql({
    host: "localhost",
    user: "postgres",
    password: "spandan9733",
    database: "testdb"
});

async function main() {
    try {
        
        let res = await pg.query("insert into pages (caption, content) values('cap1', 'content1')", []);
        console.log(res);
    } catch (error) {
        console.log(error);
    }
}

main();
