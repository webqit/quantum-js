
/**
 * @imports
 */
const path = require('path');
const CompressionPlugin = require("compression-webpack-plugin");

module.exports = {
	plugins: [ new CompressionPlugin() ],
	mode: process.argv.includes('--dev') ? 'development' : 'production',
	entry: {
		main: './src/browser-entry.js',
		'console': './src/console/index.js',
		'player': './src/console/Player.js',
		'inspector': './src/console/Inspector.js',
	},
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, 'dist'),
	},
	devtool: 'source-map',
};
