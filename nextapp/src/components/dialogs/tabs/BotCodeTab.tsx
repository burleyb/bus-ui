"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Copy } from 'lucide-react';

interface BotCodeTabProps {
  nodeData: any;
}

export default function BotCodeTab({ nodeData }: BotCodeTabProps) {
  const [copied, setCopied] = useState(false);

  // Safeguard against null nodeData
  if (!nodeData) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-500">No data available</div>
      </div>
    );
  }

  // Mock code for demonstration purposes
  const mockCode = `// Lambda function for ${nodeData?.name || 'unknown bot'}
const AWS = require('aws-sdk');
const sqs = new AWS.SQS();

exports.handler = async (event) => {
    try {
        // Process each record from the input queue
        for (const record of event.Records) {
            const body = JSON.parse(record.body);
            console.log('Processing event:', body.id);
            
            // Your business logic here
            const result = await processEvent(body);
            
            // Send result to output queue
            await sendToOutputQueue(result);
        }
        
        return { statusCode: 200, body: 'Success' };
    } catch (error) {
        console.error('Error processing events:', error);
        return { statusCode: 500, body: error.message };
    }
};

async function processEvent(event) {
    // Implement your event processing logic here
    console.log('Processing event data:', event);
    return {
        id: event.id,
        processed: true,
        timestamp: new Date().toISOString(),
        // Add processed data here
    };
}

async function sendToOutputQueue(data) {
    const params = {
        QueueUrl: process.env.OUTPUT_QUEUE_URL,
        MessageBody: JSON.stringify(data),
    };
    
    return sqs.sendMessage(params).promise();
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(mockCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Lambda Function</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyCode}
            className="h-8 gap-1"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy Code</span>
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="bg-gray-900 text-gray-300 font-mono text-sm p-4 overflow-auto h-[500px] rounded-b-lg">
            <pre>{mockCode}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 