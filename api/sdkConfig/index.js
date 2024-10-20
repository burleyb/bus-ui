'use strict';

import { CloudFormationClient, ListStackResourcesCommand } from "@aws-sdk/client-cloudformation";
import request from "leo-auth";
import config from "leo-sdk/leoConfigure";
import "moment-round";
const resourceHandler = require("leo-sdk/wrappers/resource");

export const handler = resourceHandler(async (event, context, callback) => {
  await request.authorize(event, {
    lrn: 'lrn:leo:botmon:::sdkConfig',
    action: "get",
    botmon: {}
  });

  const cloudformation = new CloudFormationClient({
    region: config._meta.region
  });

  try {
    const data = await cloudformation.send(new ListStackResourcesCommand({
      StackName: config?.Resources?.Leo || "StealthOMS-Dev-RStreamsPlatformBusC9D77D07-1KCXGEYO6Z6ZM"
    }));

    if (data.NextToken) {
      console.log("We need to deal with next token");
    }

    const resources = data.StackResourceSummaries.reduce((acc, resource) => {
      acc[resource.LogicalResourceId] = {
        type: resource.ResourceType,
        id: resource.PhysicalResourceId,
        name: resource.LogicalResourceId
      };
      return acc;
    }, {});

    let isBase64Encoded = false;
    const responseHeaders = {
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Origin': '*',
    };

    const ret = {
      kinesis: resources?.LeoKinesisStream?.id,
      s3: resources?.LeoS3Bus?.id,
      firehose: resources?.LeoFirehoseStream?.id,
      region: config.aws.region
    };    

    callback(undefined, {
        body: ret,
        headers: responseHeaders,
        isBase64Encoded,
        statusCode: 200,
    });

  } catch (err) {
    callback(err);
  }
});
