'use strict';
module.exports = {
	linkedStacks: [
		"LeoBus",
		"LeoAuth"
	],
	publish: [{
		leoaws: {
			profile: 'stealthoms',
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
				CognitoId: 'us-east-1:4c8ea47e-afff-4d1c-9bfe-8226783364ac',
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
		        LeoBus: "RstreamsDEV",
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
