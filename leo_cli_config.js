'use strict';
module.exports = {
	linkedStacks: [
		"LeoBus",
		"LeoAuth"
	],
	publish: [{
		leoaws: {
			profile: 'default',
			region: 'us-east-1'
		},
		public: true,
		staticAssets: "s3://symmatiq.com/botmon"
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
		        LeoBus: "RstreamsDEV",
		        LeoAuth: "leo-auth-stack-dev",
		        CustomJS: "",
		        Logins: ""
			}
		},		
		PROD: {
			stack: 'botmon-prod',
			region: 'us-east-1',
			parameters: {
				CognitoId: 'us-east-1:76a899db-012a-452d-a06c-939362ed05b1',
				leoauth: 'LeoProdV2-Auth-NRTY3WS1S6FF',
				leosdk: 'LeoProdV2-Bus-11Y73AXJQ91CA',
		        LeoBus: "LeoProdV2-Bus-11Y73AXJQ91CA",
		        LeoAuth: "LeoProdV2-Auth-NRTY3WS1S6FF",
		        CustomJS: "",
		        Logins: ""
			}
		},	
	},
	test: {
		port: 8080,
		basePath: "botmon",
		basehref: "botmon",
		ui: {
			basePath: "botmon/",
			apiHost: "http://34.225.230.43:8081",
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
