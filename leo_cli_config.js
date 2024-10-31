'use strict';
module.exports = {
	linkedStacks: [
	],
	publish: [{
		leoaws: {
			profile: 'default',
			region: 'us-east-1'
		},
		public: true,
		staticAssets: "s3://leo-cli-publishbucket-qzoiwmdgdtjy/botmon"
	}
	],
	deploy: {
		DEV: {
			stack: 'botmon-dev',
			region: 'us-east-1',
			parameters: {
				CognitoId: 'us-east-1:3e9094d3-afc1-407c-a548-533e22f44c34',
				leoauth: 'leo-auth-stack-dev',
				leosdk: 'RstreamsDEV',
		        CustomJS: "",
		        Logins: ""
			}
		},		
	},
	test: {
		port: 8080,
		basePath: "botmon",
		basehref: "botmon",
		region: 'us-east-1',
		ui: {
			basePath: "botmon/",
			apiHost: "http://localhost:8080",
		},
		"personas": {
			"default": {
				"identity": {
					"SourceIp": "67.207.40.96"
				}
			}
		},

		defaultPersona: 'default'
	}
};
