export function param(field ,defval = undefined) {
	if(field in this.params)
		return this.params[field];
	return defval;
}
export function get(field) {
	let f = String(field).toLowerCase();
	if(f in this.headers)
		return this.headers[f];
	return undefined;
}

export function is(type) {
	let t = this.headers['content-type'];
	return t.includes(type);
}

export default function configureRequestMethods(req)
{
	req.param = param;
	req.get = get;
	req.is = is;
	
}