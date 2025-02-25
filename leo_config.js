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
		cognito_region: 'us-east-1',
		region: 'us-east-1',
		profile: 'symmatiq',        
        basePath: "botmon/",
        basehref: "botmon/",
    },
    DEV: {
        leosdk: {
            Leo:               "RstreamsDEV",
            LeoStream:         "RstreamsDEV-LeoStream-EP7D4OKQQA4V",
            LeoCron:           "RstreamsDEV-LeoCron-S3540RRCMKFF",
            LeoEvent:          "RstreamsDEV-LeoEvent-1CI2JPZRI4XL5",
            LeoSettings:       "RstreamsDEV-LeoSettings-1PYANSN5KF62P",
            LeoSystem:         "RstreamsDEV-LeoSystem-50XSQ54RG0C5",
            LeoKinesisStream:  "RstreamsDEV-LeoKinesisStream-Sf4gUfGmtLaa",
            LeoFirehoseStream: "RstreamsDEV-LeoFirehoseStream-7dXDfIwWgfU0",
            LeoS3:             "rstreamsdev-leos3-jd6xgayqyqol",
            Region:            "us-east-1",
            LeoStats:          "botmon-dev-LeoStats-19HPMG1N4PPEQ"
        },
        leoauth: {
            Region: "us-east-1",
            LeoAuth: "leo-auth-stack-dev-LeoAuth719CEE8F-77GHPJK0UJEZ",
            LeoAuthIdentity: "leo-auth-stack-dev-LeoAuthIdentity0B3C5E31-4QEUZP0P42YT",
            LeoAuthPolicy: "leo-auth-stack-dev-LeoAuthPolicy789FD165-78K3HR1ZBCBJ",
            LeoAuthUser: "leo-auth-stack-dev-LeoAuthUser427CD581-B2RQ0I7TQTG",
            cognito_id: "us-east-1:3425a7c9-40c1-4aa0-b7c7-62e28e353b9e"
        },          
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
