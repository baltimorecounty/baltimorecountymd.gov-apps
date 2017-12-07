const path = require('path');

module.exports = {
	entry: './app/app.js',
	output: {
		filename: 'bc.walking-trails.js',
		path: path.resolve(__dirname, 'dist'),
	},
};