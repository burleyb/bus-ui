const CracoLessPlugin = require('craco-less');

module.exports = {
	plugins: [
		{
		  plugin: CracoLessPlugin,
		  options: {
			lessLoaderOptions: {
			  lessOptions: {
				javascriptEnabled: true,
			  },
			},
		  },
		},
	  ],	
	babel: {
	  plugins: [
		['@babel/plugin-transform-runtime', {
		  corejs: 3,
		  helpers: true,
		  regenerator: true,
		  absoluteRuntime: false
		}]
	  ]
	}
  };

  