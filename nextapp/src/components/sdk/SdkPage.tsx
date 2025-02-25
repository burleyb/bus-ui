'use client'
import { useState } from 'react';
import { useSdkConfig } from '@/hooks/useQueries';

// Code snippet component
const CodeSnippet = ({ language, code }: { language: string; code: string }) => {
  return (
    <div className="bg-gray-800 rounded-md overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-700">
        <span className="text-xs font-medium text-gray-200">{language}</span>
        <button 
          onClick={() => navigator.clipboard.writeText(code)}
          className="text-gray-400 hover:text-white"
          title="Copy to clipboard"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
          </svg>
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm text-white">{code}</pre>
      </div>
    </div>
  );
};

export default function SdkPage() {
  const { data: sdkConfig, isLoading } = useSdkConfig();
  const [selectedLanguage, setSelectedLanguage] = useState('node');

  // Example code snippets for different languages
  const codeSnippets = {
    node: `const leo = require('leo-sdk');

// Initialize the SDK
const botId = '${sdkConfig?.botId || 'your-bot-id'}';
const region = '${sdkConfig?.region || 'us-west-2'}';

leo.configure({
  botId,
  region,
  kinesis: '${sdkConfig?.kinesis || 'your-kinesis-stream'}',
  firehose: '${sdkConfig?.firehose || 'your-firehose-stream'}',
  s3: '${sdkConfig?.s3 || 'your-s3-bucket'}'
});

// Read from a queue
leo.read('queue-name', (err, data, done) => {
  if (err) {
    console.error(err);
    return done(err);
  }
  
  // Process the data
  console.log('Received data:', data);
  
  // Acknowledge the message
  done();
});

// Write to a queue
leo.write('output-queue', {
  id: 'unique-id',
  payload: {
    key: 'value',
    timestamp: Date.now()
  }
}, (err) => {
  if (err) {
    console.error('Error writing to queue:', err);
  } else {
    console.log('Successfully wrote to queue');
  }
});`,

    python: `import leo_sdk

# Initialize the SDK
bot_id = '${sdkConfig?.botId || 'your-bot-id'}'
region = '${sdkConfig?.region || 'us-west-2'}'

leo_sdk.configure(
    bot_id=bot_id,
    region=region,
    kinesis='${sdkConfig?.kinesis || 'your-kinesis-stream'}',
    firehose='${sdkConfig?.firehose || 'your-firehose-stream'}',
    s3='${sdkConfig?.s3 || 'your-s3-bucket'}'
)

# Read from a queue
def process_message(data):
    print(f"Received data: {data}")
    return True  # Acknowledge the message

leo_sdk.read('queue-name', process_message)

# Write to a queue
payload = {
    'key': 'value',
    'timestamp': leo_sdk.now()
}

leo_sdk.write('output-queue', 'unique-id', payload)
print('Successfully wrote to queue')`,

    java: `import com.leo.sdk.LeoSDK;
import com.leo.sdk.LeoConfig;

public class LeoExample {
    public static void main(String[] args) {
        // Initialize the SDK
        String botId = "${sdkConfig?.botId || 'your-bot-id'}";
        String region = "${sdkConfig?.region || 'us-west-2'}";
        
        LeoConfig config = new LeoConfig.Builder()
            .botId(botId)
            .region(region)
            .kinesis("${sdkConfig?.kinesis || 'your-kinesis-stream'}")
            .firehose("${sdkConfig?.firehose || 'your-firehose-stream'}")
            .s3("${sdkConfig?.s3 || 'your-s3-bucket'}")
            .build();
            
        LeoSDK leo = new LeoSDK(config);
        
        // Read from a queue
        leo.read("queue-name", (data, done) -> {
            System.out.println("Received data: " + data);
            done.acknowledge();
        });
        
        // Write to a queue
        Map<String, Object> payload = new HashMap<>();
        payload.put("key", "value");
        payload.put("timestamp", System.currentTimeMillis());
        
        leo.write("output-queue", "unique-id", payload, (err) -> {
            if (err != null) {
                System.err.println("Error writing to queue: " + err);
            } else {
                System.out.println("Successfully wrote to queue");
            }
        });
    }
}`
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">SDK Documentation</h1>
        <p className="mt-2 text-gray-600">
          Learn how to integrate with our system using the Leo SDK in your preferred programming language.
        </p>
      </div>

      <div className="mb-6">
        <div className="flex space-x-2 border-b border-gray-200">
          <button
            onClick={() => setSelectedLanguage('node')}
            className={`px-4 py-2 text-sm font-medium ${
              selectedLanguage === 'node'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Node.js
          </button>
          <button
            onClick={() => setSelectedLanguage('python')}
            className={`px-4 py-2 text-sm font-medium ${
              selectedLanguage === 'python'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Python
          </button>
          <button
            onClick={() => setSelectedLanguage('java')}
            className={`px-4 py-2 text-sm font-medium ${
              selectedLanguage === 'java'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Java
          </button>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Installation</h2>
        
        {selectedLanguage === 'node' && (
          <CodeSnippet 
            language="bash" 
            code="npm install leo-sdk --save" 
          />
        )}
        
        {selectedLanguage === 'python' && (
          <CodeSnippet 
            language="bash" 
            code="pip install leo-sdk" 
          />
        )}
        
        {selectedLanguage === 'java' && (
          <CodeSnippet 
            language="xml" 
            code={`<dependency>
  <groupId>com.leo</groupId>
  <artifactId>leo-sdk</artifactId>
  <version>1.0.0</version>
</dependency>`} 
          />
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Basic Usage</h2>
        <CodeSnippet 
          language={selectedLanguage === 'node' ? 'javascript' : selectedLanguage} 
          code={codeSnippets[selectedLanguage as keyof typeof codeSnippets]} 
        />
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Configuration</h2>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-base font-medium">SDK Configuration</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bot ID
                </label>
                <input
                  type="text"
                  value={sdkConfig?.botId || 'your-bot-id'}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Region
                </label>
                <input
                  type="text"
                  value={sdkConfig?.region || 'us-west-2'}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kinesis Stream
                </label>
                <input
                  type="text"
                  value={sdkConfig?.kinesis || 'your-kinesis-stream'}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Firehose Stream
                </label>
                <input
                  type="text"
                  value={sdkConfig?.firehose || 'your-firehose-stream'}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  S3 Bucket
                </label>
                <input
                  type="text"
                  value={sdkConfig?.s3 || 'your-s3-bucket'}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Additional Resources</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="#" className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-base font-medium mb-2">API Reference</h3>
            <p className="text-sm text-gray-600">
              Complete documentation of all SDK methods and parameters.
            </p>
          </a>
          <a href="#" className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-base font-medium mb-2">Examples</h3>
            <p className="text-sm text-gray-600">
              Sample projects and code snippets for common use cases.
            </p>
          </a>
          <a href="#" className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-base font-medium mb-2">Support</h3>
            <p className="text-sm text-gray-600">
              Get help from our team or community forums.
            </p>
          </a>
        </div>
      </div>
    </div>
  );
} 