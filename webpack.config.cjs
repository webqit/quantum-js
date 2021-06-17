
module.exports = {
	mode: process.argv.includes('--dev') ? 'development' : 'production',
	entry: './src/browser-entry.js',
	devtool: 'source-map',
};