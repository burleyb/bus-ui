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
    LABL: {
        basePath: "prod/",
        basehref: "prod/",
        CognitoId: "us-east-1:4c8ea47e-afff-4d1c-9bfe-8226783364ac",
        leosdk: {
            Leo:               "LeoProdV2",
            LeoArchive: "LeoProdV2-Bus-11Y73AXJQ91CA-LeoArchive-1ANGPVAQ38LCI",
			LeoCron: "LeoProdV2-Bus-11Y73AXJQ91CA-LeoCron-BVH4YPI757OI",
			LeoEvent: "LeoProdV2-Bus-11Y73AXJQ91CA-LeoEvent-H6EEULD62RYG",
			LeoFirehoseStream: "LeoProdV2-Bus-11Y73AXJQ91CA-LeoFirehoseStream-LMCT4TUGZBNN",
			LeoKinesisStream: "LeoProdV2-Bus-11Y73AXJQ91CA-LeoKinesisStream-XSLP9O7EHPDC",
			LeoS3: "leoprodv2-bus-11y73axjq91ca-leos3-bdhcb6hqspvm",
			LeoSettings: "LeoProdV2-Bus-11Y73AXJQ91CA-LeoSettings-ICF8PCLBVVFV",
			LeoStream: "LeoProdV2-Bus-11Y73AXJQ91CA-LeoStream-1Q7CWS2R0V4J2",
			LeoSystem: "LeoProdV2-Bus-11Y73AXJQ91CA-LeoSystem-T4OTXG98Y2WD",
            Region:            "us-east-1",
            LeoStats:          "botmon-dev-LeoStats-19HPMG1N4PPEQ"
        },
        leoauth: {
            Region: "us-east-1",
            LeoAuth: "LeoProdV2-Auth-NRTY3WS1S6FF-LeoAuth-LWUY0VKGISWO",
			LeoAuthIdentity: "LeoProdV2-Auth-NRTY3WS1S6FF-LeoAuthIdentity-VE7B10GF5A8D",
			LeoAuthPolicy: "LeoProdV2-Auth-NRTY3WS1S6FF-LeoAuthPolicy-5YEWXO0T2LX4",
			LeoAuthUser: "LeoProdV2-Auth-NRTY3WS1S6FF-LeoAuthUser-9U4DKKALLSVR",
			cognito_id: "us-east-1:4c8ea47e-afff-4d1c-9bfe-8226783364ac"
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
