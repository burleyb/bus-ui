"use strict";

var request = require("leo-auth");
var leo = require("leo-sdk")
var dynamodb = leo.aws.dynamodb;

var SETTINGS_TABLE = leo.configuration.resources.LeoSettings;
exports.handler = require("leo-sdk/wrappers/resource")(async (event, context, callback) => {
	let isBase64Encoded = false;
	await request.authorize(event, {
		lrn: 'lrn:leo:botmon:::',
		action: "settings",
		botmon: {}
	});
	dynamodb.batchGetHashkey(SETTINGS_TABLE, "id", ["lambda_templates", "botmon_files"], function (err, data) {
		if (err) {
			callback(err);
		} else {
			var ret = {};
			for (var key in data) {
				ret[key.replace(/^botmon_/, '')] = data[key].value;
			}
			if (ret.lambda_templates) {
				for (var key in ret.lambda_templates) {
					if (ret.lambda_templates[key].matches && !ret.lambda_templates[key].matches.group) {
						ret.lambda_templates[key].matches.group = 'bot';
					}
				}
			}
            const responseHeaders = {
                'Access-Control-Allow-Credentials': true,
                'Access-Control-Allow-Origin': '*',
            };
            callback(undefined, {
                body: ret,
                headers: responseHeaders,
                isBase64Encoded,
                statusCode: 200,
            });
		}
	});
});
