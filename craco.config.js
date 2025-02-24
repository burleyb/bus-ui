const CracoLessPlugin = require('craco-less');
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin');

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
	},
	webpack: {
		configure: (webpackConfig) => {
		  // Remove the ModuleScopePlugin which throws when we try
		  // to import something outside of src/.
		  webpackConfig.resolve.plugins = webpackConfig.resolve.plugins.filter(
			plugin => !(plugin instanceof ModuleScopePlugin)
		  );
		  
		  return webpackConfig;
		}
	  }
  };

  