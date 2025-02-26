import React from 'react';
import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  BookOpenIcon, 
  CodeBracketIcon, 
  DocumentTextIcon, 
  CommandLineIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

export default function SdkPage() {
  return (
    <div className="space-y-8">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">SDK Documentation</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          Everything you need to know about integrating with our services
        </p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Getting Started Card */}
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg mb-4">
              <BookOpenIcon className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Getting Started</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Quick start guides to help you integrate our SDK into your project.
            </p>
            <Link href="/sdk/getting-started" className="inline-flex items-center text-blue-600 dark:text-blue-400 font-medium">
              Read Guide
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
        
        {/* API Reference Card */}
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg mb-4">
              <CodeBracketIcon className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">API Reference</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Complete documentation of all available methods and properties.
            </p>
            <Link href="/sdk/api-reference" className="inline-flex items-center text-purple-600 dark:text-purple-400 font-medium">
              View Documentation
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
        
        {/* Examples Card */}
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg mb-4">
              <DocumentTextIcon className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Examples</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Sample code and recipes for common integration scenarios.
            </p>
            <Link href="/sdk/examples" className="inline-flex items-center text-green-600 dark:text-green-400 font-medium">
              Browse Examples
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Code Snippet Section */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Example</h2>
        
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto">
          <pre className="text-sm text-gray-800 dark:text-gray-200">
            <code>{`const leo = require('leo-sdk');

// Configure the connector
const connector = leo.configure({
  region: 'us-west-2',
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret'
});

// Read from a source
connector.read('source-queue', (batch, done) => {
  // Process the batch
  const transformedData = batch.map(event => ({
    id: event.id,
    timestamp: event.timestamp,
    payload: processPayload(event.payload)
  }));
  
  // Write to a destination
  connector.write('destination-queue', transformedData, err => {
    if (err) console.error(err);
    done();
  });
});

function processPayload(payload) {
  // Your custom logic here
  return payload;
}`}</code>
          </pre>
        </div>
      </section>
      
      {/* Downloads Section */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Downloads</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center">
            <div className="flex-shrink-0 mr-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center">
                <ArrowDownTrayIcon className="h-5 w-5" />
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">Node.js SDK</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">v2.5.0 - Latest Release</p>
              <Link href="/sdk/download/nodejs" className="text-xs text-blue-600 dark:text-blue-400">Download</Link>
            </div>
          </div>
          
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center">
            <div className="flex-shrink-0 mr-4">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-lg flex items-center justify-center">
                <ArrowDownTrayIcon className="h-5 w-5" />
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">Python SDK</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">v1.8.2 - Latest Release</p>
              <Link href="/sdk/download/python" className="text-xs text-blue-600 dark:text-blue-400">Download</Link>
            </div>
          </div>
          
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center">
            <div className="flex-shrink-0 mr-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
                <ArrowDownTrayIcon className="h-5 w-5" />
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">Java SDK</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">v1.4.0 - Latest Release</p>
              <Link href="/sdk/download/java" className="text-xs text-blue-600 dark:text-blue-400">Download</Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* CLI Section */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="md:flex md:items-start">
          <div className="md:flex-1 mb-6 md:mb-0 md:mr-8">
            <div className="flex items-center mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg mr-3">
                <CommandLineIcon className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Command Line Interface</h2>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Our CLI tool provides a powerful interface for managing your services directly from your terminal.
            </p>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Installation</h3>
                <div className="bg-gray-50 dark:bg-gray-900 rounded p-3">
                  <code className="text-sm">npm install -g leo-cli</code>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Basic Usage</h3>
                <div className="bg-gray-50 dark:bg-gray-900 rounded p-3">
                  <code className="text-sm">leo-cli deploy</code>
                </div>
              </div>
              
              <div className="pt-2">
                <Link href="/sdk/cli" className="inline-flex items-center text-indigo-600 dark:text-indigo-400 font-medium">
                  View CLI Documentation
                  <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
          
          <div className="md:w-2/5">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-hidden">
              <pre className="text-xs text-gray-800 dark:text-gray-200 overflow-x-auto">
                <code>{`$ leo-cli --help
Usage: leo-cli [options] [command]

Options:
  -V, --version              output the version number
  -h, --help                 display help for command

Commands:
  create [options] <name>    Create a new bot
  deploy [options]           Deploy resources to AWS
  publish [options] <queue>  Publish to a queue
  read [options] <queue>     Read from a queue
  status                     Check status of deployed resources
  help [command]             display help for command`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>
      
      {/* Support Section */}
      <section className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-800 dark:to-indigo-900 rounded-lg shadow-md p-8 text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Need Help?</h2>
          <p className="text-blue-100 dark:text-blue-200 mb-6">
            Our support team is ready to assist you with any questions about our SDK.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link href="/sdk/support" className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-medium shadow-sm transition-colors">
              Contact Support
            </Link>
            <Link href="https://github.com/your-repo" className="bg-blue-700 hover:bg-blue-800 dark:bg-blue-900 dark:hover:bg-blue-950 px-6 py-3 rounded-lg font-medium shadow-sm transition-colors">
              GitHub Repository
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
} 