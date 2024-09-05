'use strict';
import config from "leo-sdk/leoConfigure.js";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client();

export const handler = async function (event, context, callback) {
  try {
    await context.leouser.authorize(event, {
      lrn: 'lrn:leo:botmon:::csv/{queue}',
      action: "csvUpload",
      csv: {
        queue: 'test'
      }
    });

    const url = await s3.getSignedUrl(new GetObjectCommand({
      Bucket: config.bus.s3,
      Key: "systems/csv/",
      Expires: 60
    }));

    callback(null, url);
  } catch (err) {
    callback(err);
  }
};
