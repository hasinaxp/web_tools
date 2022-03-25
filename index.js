let doggu = {
	name: 'big doggu'
}
let obj = {
	happy : 'i am happy',
	doggy : [() => {
		console.log('hello world');
	}]
};

let json = JSON.stringify(obj);
console.log(json);