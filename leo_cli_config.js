'use strict';
module.exports = {
	linkedStacks: [
		"LeoBus",
		"LeoAuth"
	],
	publish: [{
		leoaws: {
			profile: 'leo',
			region: 'us-east-1'
		},
		public: true,
		staticAssets: "s3://smartshyp-tracking-prod-trackings3bucket-1qozxsymkq9zv/leo_botmon"
	}
	],
	deploy: {
		DEV_OLD: {
			stack: 'botmon-dev-old',
			region: 'us-east-1',
			parameters: {
				CognitoId: 'us-east-1:4c8ea47e-afff-4d1c-9bfe-8226783364ac',
				cognito_region: 'us-east-1',
				region: 'us-east-1',
				leoauth: 'LeoPlatformV2-Auth-1X7Q0AF7Z7REV',
				leosdk: 'LeoPlatformV2-Bus-WJHM1F32629G',
		        LeoBus: "LeoPlatformV2-Bus-WJHM1F32629G",
		        LeoAuth: "LeoPlatformV2-Auth-1X7Q0AF7Z7REV",
		        CustomJS: "",
		        Logins: ""
			}
		},
		DEV: {
			stack: 'botmon-dev',
			region: 'us-east-1',
			parameters: {
				CognitoId: 'us-east-1:4c8ea47e-afff-4d1c-9bfe-8226783364ac',
				cognito_region: 'us-east-1',
				region: 'us-east-1',
				leoauth: 'LeoPlatformV2-Auth-1X7Q0AF7Z7REV',
				leosdk: 'LeoDevV2-Bus',
		        LeoBus: "LeoDevV2-Bus",
		        LeoAuth: "LeoPlatformV2-Auth-1X7Q0AF7Z7REV",
		        CustomJS: "",
		        Logins: ""
			}
		},		
		PROD: {
			stack: 'botmon-prod',
			region: 'us-east-1',
			parameters: {
				CognitoId: 'us-east-1:76a899db-012a-452d-a06c-939362ed05b1',
				cognito_region: 'us-east-1',
				region: 'us-east-1',
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
		region: 'us-east-1',
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
