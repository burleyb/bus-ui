'use strict';
const leoauth = process.env.leoauthsdk && JSON.parse(process.env.leoauthsdk) || {};
const leosdk = process.env.leosdk && JSON.parse(process.env.leosdk) || {};

module.exports = {
    /**defaults applied to every system**/
    _global: {
        leoauth: leoauth.resources || leoauth,
        leosdk: leosdk.resources || leosdk,
        Resources: process.env.Resources || leosdk.resources,
		CognitoId: "us-east-1:3e9094d3-afc1-407c-a548-533e22f44c34",
		cognito_region: 'us-east-1',
		region: 'us-east-1',
		profile: 'symmatiq',
		basePath: "botmon/",
		basehref: "botmon/"
    },
    DEV: {
        leosdk: {
            "Leo":               "SymmatiqDev-RStreamsPlatformBusC9D77D07-YSTIH0GP071F",
            "LeoStream":         "SymmatiqDev-RStreamsPlatformBusC9D77D07-YSTIH0GP071F-LeoStream-TWI8DMLSEJT0",
            "LeoCron":           "SymmatiqDev-RStreamsPlatformBusC9D77D07-YSTIH0GP071F-LeoCron-D7X9B35W6A1L",
            "LeoEvent":          "SymmatiqDev-RStreamsPlatformBusC9D77D07-YSTIH0GP071F-LeoEvent-17UABWOHMDZTB",
            "LeoSettings":       "SymmatiqDev-RStreamsPlatformBusC9D77D07-YSTIH0GP071F-LeoSettings-18W9ID339U5AM",
            "LeoSystem":         "SymmatiqDev-RStreamsPlatformBusC9D77D07-YSTIH0GP071F-LeoSystem-1SUE40LASJJQL",
            "LeoKinesisStream":  "SymmatiqDev-RStreamsPlatformBusC9D77D07-YSTIH0GP071F-LeoKinesisStream-GLSHzZnfcxNa",
            "LeoFirehoseStream": "SymmatiqDev-RStreamsPlatformBusC9D77D07-YSTIH0GP071-oKFGyxwrYfdS",
            "LeoS3":             "symmatiqdev-rstreamsplatformbusc9d77d07-ysti-leos3-u9vbibkepqsx",
            "Region":            "us-east-1",
            "LeoStats":          "SymmatiqDev-RStreamsPlatformBotmonA0BC40F1-1EX7NMKFE6ESV-LeoStats-10V8K26V6D5DG"
        },
        leoauth: {
            Region: "us-east-1",
            LeoAuth: "SymmatiqDev-RStreamsPlatformAuth543A3B88-1I25S5KUFXIRF-LeoAuth719CEE8F-DG9R720X8LAJ",
            LeoAuthIdentity: "SymmatiqDev-RStreamsPlatformAuth543A3B88-1I25S5KUFXIRF-LeoAuthIdentity0B3C5E31-1H182SMEZ9Z0T",
            LeoAuthPolicy: "SymmatiqDev-RStreamsPlatformAuth543A3B88-1I25S5KUFXIRF-LeoAuthPolicy789FD165-13T50DB7OT8GI",
            LeoAuthUser: "SymmatiqDev-RStreamsPlatformAuth543A3B88-1I25S5KUFXIRF-LeoAuthUser427CD581-KWBW35URB81C",
            cognito_id: "us-east-1:3e9094d3-afc1-407c-a548-533e22f44c34"
        },        
        ui: {
            staticAssets: "https://d1duc0za9qk2vm.cloudfront.net/leo_botmon",
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
            profile: 'symmatiq',
            region: leosdk.region || leosdk.Region || (leosdk.resources && leosdk.resources.Region) || 'us-east-1'
        }
    }
};
