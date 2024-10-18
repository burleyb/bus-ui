'use strict';
const leoauth = process.env.leoauthsdk && JSON.parse(process.env.leoauthsdk) || {};
const leosdk = process.env.leosdk && JSON.parse(process.env.leosdk) || {};

module.exports = {
    /**defaults applied to every system**/
    _global: {
        leoauth: leoauth.resources || leoauth,
        leosdk: leosdk.resources || leosdk,
        Resources: process.env.Resources || leosdk.resources,
		CognitoId: "us-east-1:8e3283a9-9fbf-48f4-af41-97860020622b",
		cognito_region: 'us-east-1',
		region: 'us-east-1',
		profile: 'stealthoms',
		basePath: "botmon/",
		basehref: "botmon/",
        stacks: {
            Leo: "LeoProdV2"
        }
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
        leosdk: {
            Region: "us-east-1",
            "Leo":"StealthOMS-Dev",
            "LeoStream":"StealthOMS-Dev-RStreamsPlatformBusC9D77D07-1KCXGEYO6Z6ZM-LeoStream-14G8N5V6TWFZZ",
            "LeoCron":"StealthOMS-Dev-RStreamsPlatformBusC9D77D07-1KCXGEYO6Z6ZM-LeoCron-1R3SJO0HKPP0X",
            "LeoEvent":"StealthOMS-Dev-RStreamsPlatformBusC9D77D07-1KCXGEYO6Z6ZM-LeoEvent-M8A0E2BSGJY5",
            "LeoSettings":"StealthOMS-Dev-RStreamsPlatformBusC9D77D07-1KCXGEYO6Z6ZM-LeoSettings-106J79724REJB",
            "LeoSystem":"StealthOMS-Dev-RStreamsPlatformBusC9D77D07-1KCXGEYO6Z6ZM-LeoSystem-1R9W18EBFTNS",
            "LeoKinesisStream":"StealthOMS-Dev-RStreamsPlatformBusC9D77D07-1KCXGEYO6Z6ZM-LeoKinesisStream-4LfbsqJjxIro",
            "LeoFirehoseStream":"StealthOMS-Dev-RStreamsPlatformBusC9D77D07-1KCXGEYO-SVH4QSLSOD6Y",
            "LeoS3":"stealthoms-dev-rstreamsplatformbusc9d77d07-1-leos3-vvgbym7dovze",	            
            "LeoStats":"StealthOMS-Dev-RStreamsPlatformBotmonA0BC40F1-18197O260P2FU-LeoStats-1P6WDH0AO2Q11",
        },
        leoauth: {
            Region: "us-east-1",
            LeoAuth: "StealthOMS-Dev-RStreamsPlatformAuth543A3B88-FDPC91QIF3ET-LeoAuth719CEE8F-1V15K5RGWR5VB",
            LeoAuthIdentity: "StealthOMS-Dev-RStreamsPlatformAuth543A3B88-FDPC91QIF3ET-LeoAuthIdentity0B3C5E31-1BID353WZN918",
            LeoAuthPolicy: "StealthOMS-Dev-RStreamsPlatformAuth543A3B88-FDPC91QIF3ET-LeoAuthPolicy789FD165-P5L99JKSWRJY",
            LeoAuthUser: "StealthOMS-Dev-RStreamsPlatformAuth543A3B88-FDPC91QIF3ET-LeoAuthUser427CD581-1T854P5F5FICW",
            cognito_id: "us-east-1:8e3283a9-9fbf-48f4-af41-97860020622b",
        },        
        ui: {
            staticAssets: "https://d1duc0za9qk2vm.cloudfront.net/leo_botmon",
            cognito: {
                id: "us-east-1:8e3283a9-9fbf-48f4-af41-97860020622b"
            },
			CognitoId: "us-east-1:8e3283a9-9fbf-48f4-af41-97860020622b",
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
