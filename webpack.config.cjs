
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
		'console-element': './src/console/Console.js',
		'player-element': './src/console/Player.js',
		'inspector-element': './src/console/Inspector.js',
		'dev-elements': './src/console/index.js',
	},
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, 'dist'),
	},
	devtool: 'source-map',
};
