import React from 'react';
import CodeBlock from '../../../components/common/CodeBlock';

const examples = {
  nodejs: {
    setup: `const rstreams = require('rstreams');
const client = new rstreams.Client(config);`,
    read: `await client.read('myQueue', async (event) => {
  console.log('Processing event:', event);
});`,
    write: `await client.write('myQueue', {
  type: 'user.created',
  data: { id: 123, name: 'John' }
});`
  },
  python: {
    setup: `from rstreams import Client
client = Client(config)`,
    read: `async def process_event(event):
    print(f"Processing event: {event}")

await client.read("myQueue", process_event)`,
    write: `await client.write("myQueue", {
    "type": "user.created",
    "data": {"id": 123, "name": "John"}
})`
  }
};

export default function CodeExamples({ language }) {
  const langExamples = examples[language] || examples.nodejs;

  return (
    <div className="space-y-6 mt-8">
      <div>
        <h3 className="text-lg font-medium mb-2">Setup</h3>
        <CodeBlock code={langExamples.setup} language={language} />
      </div>
      <div>
        <h3 className="text-lg font-medium mb-2">Reading Events</h3>
        <CodeBlock code={langExamples.read} language={language} />
      </div>
      <div>
        <h3 className="text-lg font-medium mb-2">Writing Events</h3>
        <CodeBlock code={langExamples.write} language={language} />
      </div>
    </div>
  );
}
