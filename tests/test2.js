import  fetch  from "../modules/fetch.js";

async function main() {
	let res = await fetch('https://jsonplaceholder.typicode.com/todos/', {
		method: 'POST', 
		Headers: {
			'Content-type' : 'application/json'
		},
		body: JSON.stringify({
			title: 'neque voluptates ratione spandan mondal',
			completed: false
		})
	});
	let data = await res.json();
	console.log(data);
}

main();