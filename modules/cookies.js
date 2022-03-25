
export function getCookies () {
    const list = {};
    const cookieHeader = this.headers?.cookie;
    if (!cookieHeader) return list;

    cookieHeader.split(`;`).forEach(function(cookie) {
        let [ name, ...rest] = cookie.split(`=`);
        name = name?.trim();
        if (!name) return;
        const value = rest.join(`=`).trim();
        if (!value) return;
        list[name] = decodeURIComponent(value);
    });

    return list;
}

export function setCookies(cookies) {
	let cookieStrings = [];
	for(let key in cookies) {
		cookieStrings.push(`${key}=${encodeURIComponent(cookies[key])}`);
	}
	this.setHeader('Set-Cookie', cookieStrings.join(";"));
}

export default function configureCookieMethods(req, res) {
	req.getCookies = getCookies;
	res.setCookies = setCookies;
}