import fs from 'fs';

export default class RenderEngine {
	constructor(renderpath) {
		this.renderPath = renderpath;
		this.extension = 'htm';
	}

	resolveInclude(html) {

		let ext = this.extension;
		try {
			const RE_Include = /\{\{ *@include *<([^%>]+)> *\}\}/gm;
			let trace = true;
			let text = html;
			while (trace) {
				text = text.replace(RE_Include, (s, v) => {

					let file;
					if (v.indexOf(`.${ext}`) === v.length - (ext.length + 1))
						file = fs.readFileSync(`${this.renderPath}/${v}`, { encoding: 'utf8' });
					else
						file = fs.readFileSync(`${this.renderPath}/${v}.${ext}`, { encoding: 'utf8' });

					return file;
				})
				trace = RE_Include.test(text);
			}
			return text;
		} catch (error) {
			console.log(error);
			return `<h1>RENDER ERROR: </h1>
			<p style="color: red; font-size: 22px;">include path not valid.</p>
			<p style="color: red; font-size: 22px;"><em>${error.message}</em></p>
			<h3>trace:</h3>
			<p style="color: red; font-size: 18px;">${error.stack.replace(/at/g, '<br/>&nbsp; at')}</p>`;
		}


	}


	dynamicFormat(html, options) {
		try {
			let re = /\{\{([^%>]+)?\}\}/g, reExp = /(^( )?(if|for|else|switch|case|break|{|}))(.*)?/g, code = 'var r=[];\n', cursor = 0, match;
			let add = function (line, js) {
				js ? (code += line.match(reExp) ? line + '\n' : 'r.push(' + line + ');\n') :
					(code += line != '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '');
				return add;
			}
			while (match = re.exec(html)) {
				add(html.slice(cursor, match.index))(match[1], true)
				cursor = match.index + match[0].length
			}
			add(html.substr(cursor, html.length - cursor))
			code += 'return r.join("");'
			return new Function(code.replace(/[\r\t\n]/g, '')).apply(options)
		} catch (error) {
			console.log(error);
			return `<h1>RENDER ERROR: </h1>
			<p style="color: red; font-size: 22px;"><em>${error.message}</em></p>
			<h3>trace:</h3>
			<p style="color: red; font-size: 18px;">${error.stack.replace(/at/g, '<br/>&nbsp; at')}</p>`;
		}

	}

	render(filename, props) {

		let file;
		let ext = this.extension;


		if (filename.indexOf(`.${ext}`) === (ext.length + 1))
			file = fs.readFileSync(`${this.renderPath}/${filename}`, { encoding: 'utf8' });
		else
			file = fs.readFileSync(`${this.renderPath}/${filename}.${ext}`, { encoding: 'utf8' });

		let html = this.resolveInclude(file);

		return this.dynamicFormat(html, props);
	}
};
