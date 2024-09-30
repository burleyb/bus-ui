import React, { useContext, useEffect } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { DataContext } from '../../stores/DataContext.jsx'; // Assuming Context API for global state

function ApiData() {
    const { state, dispatch } = useContext(DataContext); // Use Context for global state management

    // Function to get settings from API
    const getSettings = () => {
        axios.get('/api/settings/')
            .then((response) => {
                const data = response.data;
                window.templates = data.lambda_templates || {};
                
                for (const template_id in data.lambda_templates) {
                    const template = data.lambda_templates[template_id] || {};
                    if (template.validator) {
                        const module = { exports: {} };
                        eval(template.validator);  // Handle validation logic, keeping it as is
                        template.validator = module.exports;
                    }
                }

                // Call fetchData after settings are loaded
                fetchData();
            })
            .catch((error) => {
                if (error.message !== 'canceled') {
                    console.warn('Failure retrieving settings', error);
                    fetchData(); // Attempt to fetch data even on error
                }
            });
    };

    // Function to fetch data (replacing MobX logic)
    const fetchData = () => {
        dispatch({ type: 'FETCH_STATS_START' });

        axios.get('/api/stats/')
            .then((response) => {
                const stats = response.data;
                dispatch({ type: 'SET_STATS', payload: stats });
            })
            .catch((error) => {
                console.error('Error fetching stats', error);
            });
    };

    // Call getSettings on component mount
    useEffect(() => {
        getSettings();
    }, []); // Empty dependency array ensures it runs only once on mount

    return null; // As in the original, this component does not render anything
}

export default ApiData;
