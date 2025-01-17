'use strict';
const leoauth = process.env.leoauthsdk && JSON.parse(process.env.leoauthsdk) || {};
const leosdk = process.env.leosdk && JSON.parse(process.env.leosdk) || {};

module.exports = {
    /**defaults applied to every system**/
    _global: {
        leoAuth: leoauth.resources || leoauth,
        leoBus: leosdk.resources || leosdk,
        leoauth: leoauth.resources || leoauth,
        leosdk: leosdk.resources || leosdk,
        Resources: process.env.Resources && JSON.parse(process.env.Resources) || leosdk.resources,
		CognitoId: "us-east-1:3425a7c9-40c1-4aa0-b7c7-62e28e353b9e",
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
                id: "us-east-1:3425a7c9-40c1-4aa0-b7c7-62e28e353b9e"
            },
			CognitoId: "us-east-1:3425a7c9-40c1-4aa0-b7c7-62e28e353b9e",
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
