'use strict';
const leoauth = process.env.leoauthsdk && JSON.parse(process.env.leoauthsdk) || {};
const leosdk = process.env.leosdk && JSON.parse(process.env.leosdk) || {};

module.exports = {
    /**defaults applied to every system**/
    _global: {
        leoauth: leoauth.resources || leoauth,
        leosdk: leosdk.resources || leosdk,
        Resources: process.env.Resources || leosdk.resources,
		CognitoId: "us-east-1:4c8ea47e-afff-4d1c-9bfe-8226783364ac",
		cognito_region: 'us-east-1',
		region: 'us-east-1',
		profile: 'stealthoms',
		basePath: "botmon/",
		basehref: "botmon/",
    },
    PROD: {
        ui: {
            staticAssets: "https://d1duc0za9qk2vm.cloudfront.net/leo_botmon",
            cognito: {
                id: "us-east-1:76a899db-012a-452d-a06c-939362ed05b1"
            },
            region: "us-east-1"
        }
    },
    DEV: {
        ui: {
            staticAssets: "https://d1duc0za9qk2vm.cloudfront.net/leo_botmon",
            cognito: {
                id: "us-east-1:4c8ea47e-afff-4d1c-9bfe-8226783364ac"
            },
			CognitoId: "us-east-1:4c8ea47e-afff-4d1c-9bfe-8226783364ac",
			Region: "us-east-1",
			CustomJS: "",
			basePath: "botmon/",
			basehref: "botmon/",
        }
    },    
    _local: {
        leoaws: {
            profile: 'stealthoms',
            region: leosdk.region || leosdk.Region || (leosdk.resources && leosdk.resources.Region) || 'us-east-1'
        }
    }
};
