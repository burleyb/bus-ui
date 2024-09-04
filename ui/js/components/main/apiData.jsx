import React from 'react';
import { useQuery } from '@tanstack/react-query'; // Importing useQuery hook

// Define a function to fetch settings data
const fetchSettings = async (apiUrl) => {
    const response = await fetch(`${apiUrl}/settings/`);
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    const data = await response.json();

    // Process the lambda templates if they exist
    const templates = data.lambda_templates || {};
    Object.keys(templates).forEach((templateId) => {
        const template = templates[templateId];
        if (template?.validator) {
            const module = { exports: {} };
            eval(template.validator); // Be careful with eval
            template.validator = module.exports;
        }
    });

    return data;
};

const ApiData = ({ apiUrl }) => {
    // Use the TanStack Query to fetch settings data
    const { data, error, isLoading, isError } = useQuery(
        ['settings'], // Unique key for this query
        () => fetchSettings(apiUrl) // Query function that fetches data
    );

    // If loading, show a loading message
    if (isLoading) {
        return <div>Loading settings...</div>;
    }

    // If there's an error, show an error message
    if (isError) {
        return <div>Error fetching settings: {error.message}</div>;
    }

    // Processed data is available here once the request is successful
    return (
        <div>
            <h2>Settings Loaded</h2>
            {/* You can render or further process the settings data here */}
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
    );
};

export default ApiData;
