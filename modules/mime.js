export default class Mime
{
	constructor() {
		this.table = {
			'application/json' : ['json'],
			'text/html' : ['html', 'htm'],
			'text/javascript' : ['js', 'mjs'],
			'text/plain' : ['txt'],
			'image/jpeg': ['jpeg', 'jpg'],
			'image/png': ['png'],
			'image/svg+xml' : ['svg'], 
			'image/vnd.microsoft.icon': ['ico'],
			'image/webp' : ['webp'],
			'application/pdf' : ['pdf'],
			'text/csv' : ['csv'],
			'font/otf' : ['otf'],
			'font/ttf' : ['ttf'],
			'font/woff' : ['woff'],
			'font/woff2' : ['woff2'],
			'audio/mp3' : ['mp3'],
			'audio/wav' : ['wav'],
			'audio/webm' : ['webm'],
			'video/mp4' : ['mp4'],
			'video/mpeg' : ['mpeg'],
			'application/vnd.rar' : ['rar'],
			'application/vnd.ms-powerpoint': ['ppt'],
			'application/zip' : ['zip'],
			'application/x-7z-compressed' : ['7z'],
			'application/xml' : ['xml'],
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],

		}
	}

	getType(val) {

		let ext = val.split('.');
		ext = ext[ext.length - 1];
		ext = String(ext).toLowerCase();
		for(let type in  this.table) {
			for(let e of this.table[type])
			{
				if(e === ext)
					return type;
			}
		}
		return 'unknown';
	}
	
	getExtension(type) {
		return this.table[type][0];
	}
}