'use strict';
const leoauth = process.env.leoauthsdk && JSON.parse(process.env.leoauthsdk) || {};
const leosdk = process.env.leosdk && JSON.parse(process.env.leosdk) || {};

module.exports = {
    /**defaults applied to every system**/
    _global: {
        leoauth: leoauth.resources || leoauth,
        leosdk: leosdk.resources || leosdk,
        Resources: process.env.Resources && JSON.parse(process.env.Resources) || leosdk.resources,
		CognitoId: "us-east-1:4c8ea47e-afff-4d1c-9bfe-8226783364ac",
			basePath: "botmon/",
			basehref: "botmon/",
    },
    PROD: {
        ui: {
            staticAssets: "https://s3.us-east-1.amazonaws.com/symmatiq.com/botmon",
            cognito: {
                id: "us-east-1:76a899db-012a-452d-a06c-939362ed05b1"
            },
            region: "us-east-1"
        }
    },
    DEV: {
        ui: {
            staticAssets: "https://s3.us-east-1.amazonaws.com/symmatiq.com/botmon",
            cognito: {
                id: "us-east-1:3e9094d3-afc1-407c-a548-533e22f44c34"
            },
			CognitoId: "us-east-1:3e9094d3-afc1-407c-a548-533e22f44c34",
			Region: "us-east-1",
			CustomJS: "",
			basePath: "botmon/",
			basehref: "botmon/",
        }
    },    
    _local: {
        leoaws: {
            profile: 'default',
            region: leosdk.region || leosdk.Region || (leosdk.resources && leosdk.resources.Region) || 'us-east-1'
        }
    }
};
