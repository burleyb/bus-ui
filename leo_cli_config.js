'use strict';
module.exports = {
	linkedStacks: [
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
		DEV_BUILD: {
			stack: 'botmon-dev',
			region: 'us-east-1',
			parameters: {
				CognitoId: 'us-east-1:8e3283a9-9fbf-48f4-af41-97860020622b',
				leoauth: 'leo-auth-stack-dev',
				leosdk: 'RstreamsDEV',
		        CustomJS: "",
		        Logins: ""
			}
		},		
		DEV: {
			stack: 'StealthOMS-Dev-RStreamsPlatformBotmonA0BC40F1-18197O260P2FU',
			region: 'us-east-1',
			parameters: {
				CognitoId: 'us-east-1:8e3283a9-9fbf-48f4-af41-97860020622b',
				leoauth: 'StealthOMS-Dev-RStreamsPlatformAuth543A3B88-FDPC91QIF3ET',
				leosdk: 'StealthOMS-Dev',
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
