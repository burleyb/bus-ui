import React from 'react';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  CheckCircleIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline';

export default function GettingStartedPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center mb-6">
        <Link 
          href="/sdk" 
          className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to SDK Documentation
        </Link>
      </div>
      
      <header>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Getting Started with the SDK</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          Learn how to quickly integrate our SDK into your application
        </p>
      </header>
      
      {/* Table of Contents */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Contents</h2>
        <nav>
          <ul className="space-y-2">
            <li>
              <a href="#installation" className="text-blue-600 dark:text-blue-400 hover:underline">Installation</a>
            </li>
            <li>
              <a href="#configuration" className="text-blue-600 dark:text-blue-400 hover:underline">Configuration</a>
            </li>
            <li>
              <a href="#basic-usage" className="text-blue-600 dark:text-blue-400 hover:underline">Basic Usage</a>
            </li>
            <li>
              <a href="#working-with-events" className="text-blue-600 dark:text-blue-400 hover:underline">Working with Events</a>
            </li>
            <li>
              <a href="#troubleshooting" className="text-blue-600 dark:text-blue-400 hover:underline">Troubleshooting</a>
            </li>
            <li>
              <a href="#next-steps" className="text-blue-600 dark:text-blue-400 hover:underline">Next Steps</a>
            </li>
          </ul>
        </nav>
      </div>
      
      {/* Installation Section */}
      <section id="installation" className="scroll-mt-16">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <CodeBracketIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Installation</h2>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Our SDK is available as an npm package for Node.js applications. You can install it using npm or yarn:
          </p>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Using npm</h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                <code className="text-sm">npm install leo-sdk --save</code>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Using yarn</h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                <code className="text-sm">yarn add leo-sdk</code>
              </div>
            </div>
            
            <div className="pt-4">
              <p className="text-gray-600 dark:text-gray-400">
                For other platforms and languages, please refer to our language-specific guides:
              </p>
              <ul className="mt-2 space-y-1 list-disc list-inside text-gray-600 dark:text-gray-400">
                <li>
                  <Link href="/sdk/languages/python" className="text-blue-600 dark:text-blue-400 hover:underline">
                    Python Installation Guide
                  </Link>
                </li>
                <li>
                  <Link href="/sdk/languages/java" className="text-blue-600 dark:text-blue-400 hover:underline">
                    Java Installation Guide
                  </Link>
                </li>
                <li>
                  <Link href="/sdk/languages/go" className="text-blue-600 dark:text-blue-400 hover:underline">
                    Go Installation Guide
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      
      {/* Configuration Section */}
      <section id="configuration" className="scroll-mt-16">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <CodeBracketIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Configuration</h2>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            After installing the SDK, you need to configure it with your credentials and settings.
          </p>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Basic Configuration</h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-800 dark:text-gray-200">
                  <code>{`const leo = require('leo-sdk');

// Configure the SDK
const connector = leo.configure({
  region: 'us-west-2',        // AWS region where your resources are deployed
  apiKey: 'your-api-key',     // Your API key
  apiSecret: 'your-api-secret', // Your API secret
  
  // Optional parameters
  timeout: 30000,             // Request timeout in milliseconds
  retries: 3,                 // Number of retry attempts
  logLevel: 'info'            // Logging level: debug, info, warn, error
});`}</code>
                </pre>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Environment Variables</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You can also use environment variables for configuration, which is the recommended approach for sensitive information like API keys.
              </p>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-800 dark:text-gray-200">
                  <code>{`// .env file
LEO_API_KEY=your-api-key
LEO_API_SECRET=your-api-secret
LEO_REGION=us-west-2

// In your code
const leo = require('leo-sdk');
require('dotenv').config();

// The SDK will automatically use the environment variables
const connector = leo.configure();`}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Basic Usage Section */}
      <section id="basic-usage" className="scroll-mt-16">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <CodeBracketIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Basic Usage</h2>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Once configured, you can start using the SDK to interact with queues and process events.
          </p>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Reading from a Queue</h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-800 dark:text-gray-200">
                  <code>{`// Read from a queue
connector.read('source-queue', (batch, done) => {
  console.log(\`Processing \${batch.length} events\`);
  
  // Process each event in the batch
  batch.forEach(event => {
    console.log('Event ID:', event.id);
    console.log('Payload:', event.payload);
  });
  
  // Call done() when processing is complete
  done();
});`}</code>
                </pre>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Writing to a Queue</h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-800 dark:text-gray-200">
                  <code>{`// Write events to a queue
const events = [
  {
    id: 'event-1',
    payload: { message: 'Hello, world!' }
  },
  {
    id: 'event-2',
    payload: { message: 'Another event' }
  }
];

connector.write('destination-queue', events, (err) => {
  if (err) {
    console.error('Error writing to queue:', err);
    return;
  }
  console.log('Successfully wrote events to queue');
});`}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Working with Events Section */}
      <section id="working-with-events" className="scroll-mt-16">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <CodeBracketIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Working with Events</h2>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Our SDK provides several utilities for working with events, including transformation, validation, and enrichment.
          </p>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Transforming Events</h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-800 dark:text-gray-200">
                  <code>{`// Transform events using map
connector.read('source-queue', (batch, done) => {
  const transformedEvents = batch.map(event => ({
    id: event.id,
    payload: {
      ...event.payload,
      processed: true,
      processedAt: new Date().toISOString()
    }
  }));
  
  // Write transformed events to destination
  connector.write('destination-queue', transformedEvents, done);
});`}</code>
                </pre>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Validating Events</h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-800 dark:text-gray-200">
                  <code>{`// Validate events against a schema
const Ajv = require('ajv');
const ajv = new Ajv();

const schema = {
  type: 'object',
  required: ['message'],
  properties: {
    message: { type: 'string' },
    priority: { type: 'integer', minimum: 1, maximum: 5 }
  }
};

const validate = ajv.compile(schema);

connector.read('source-queue', (batch, done) => {
  const validEvents = batch.filter(event => {
    const valid = validate(event.payload);
    if (!valid) {
      console.error('Invalid event:', event.id, validate.errors);
    }
    return valid;
  });
  
  connector.write('valid-events-queue', validEvents, done);
});`}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Troubleshooting Section */}
      <section id="troubleshooting" className="scroll-mt-16">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <CodeBracketIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Troubleshooting</h2>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Here are some common issues and their solutions when working with the SDK.
          </p>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Connection Issues</h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <p className="text-gray-800 dark:text-gray-200 font-medium">Problem:</p>
                <p className="text-gray-600 dark:text-gray-400 mb-2">Connection timeouts or "Unable to connect" errors.</p>
                
                <p className="text-gray-800 dark:text-gray-200 font-medium">Solution:</p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                  <li>Verify your network connection</li>
                  <li>Check that your API credentials are correct</li>
                  <li>Confirm that the region is correct</li>
                  <li>Increase the timeout value in the configuration</li>
                </ul>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Permission Errors</h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <p className="text-gray-800 dark:text-gray-200 font-medium">Problem:</p>
                <p className="text-gray-600 dark:text-gray-400 mb-2">"Access denied" or "Insufficient permissions" errors.</p>
                
                <p className="text-gray-800 dark:text-gray-200 font-medium">Solution:</p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                  <li>Ensure your API key has the necessary permissions</li>
                  <li>Check IAM policies if using AWS credentials</li>
                  <li>Verify that the queue names are correct</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Next Steps Section */}
      <section id="next-steps" className="scroll-mt-16">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <CodeBracketIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Next Steps</h2>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Now that you're familiar with the basics, here are some resources to help you go further:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-start">
                <div className="mr-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">Advanced Usage Patterns</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Learn about advanced patterns like fan-out, aggregation, and error handling.
                  </p>
                  <Link href="/sdk/advanced-patterns" className="text-sm text-blue-600 dark:text-blue-400 mt-2 inline-block">
                    View Advanced Guide
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-start">
                <div className="mr-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">Example Projects</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Browse complete example projects to see the SDK in action.
                  </p>
                  <Link href="/sdk/examples" className="text-sm text-blue-600 dark:text-blue-400 mt-2 inline-block">
                    View Examples
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-start">
                <div className="mr-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">API Reference</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Detailed documentation of all SDK methods and properties.
                  </p>
                  <Link href="/sdk/api-reference" className="text-sm text-blue-600 dark:text-blue-400 mt-2 inline-block">
                    View API Reference
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-start">
                <div className="mr-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">Community & Support</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Join our community forums and get support from our team.
                  </p>
                  <Link href="/sdk/support" className="text-sm text-blue-600 dark:text-blue-400 mt-2 inline-block">
                    Visit Support Center
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}