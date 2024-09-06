import React, { useState, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import TagsInput from '../elements/tagsInput.jsx';
import { DataContext } from '../../../stores/DataContext'; // Assuming DataContext for state
import Dialog from './dialog'; // Assuming you have a Dialog component

// Function to fetch SNS data
const fetchSNSData = async () => {
    const { data } = await axios.get('/api/sns_get');
    return data;
};

// Function to update a topic
const saveTopic = async (topic) => {
    const { data } = await axios.post(`/api/sns_save/topic/${topic.arn}`, topic);
    return data;
};

function Topics({ onClose }) {
    const { state } = useContext(DataContext);
    const queryClient = useQueryClient(); // TanStack Query Client
    const [dialog, setDialog] = useState(undefined);
    const [defaults, setDefaults] = useState({});
    
    // Fetch topics and subscriptions data using TanStack Query
    const { data: snsData, error, isLoading } = useQuery(['snsData'], fetchSNSData, {
        onSuccess: (data) => {
            state.topicInfo = data; // Update global state via React Context
        },
    });

    // Mutation for updating a topic
    const mutation = useMutation(saveTopic, {
        onSuccess: (updatedTopic) => {
            // Invalidate and refetch the snsData query to update the UI
            queryClient.invalidateQueries(['snsData']);
        },
        onError: () => {
            // Handle error
            window.messageLogNotify('Failed to update topic', 'error');
        },
    });

    const setupData = (data) => {
        const newTopics = {};
        const regEx = /(?:)([^:]*)$/g;
        Object.keys(data.topicAttributes).forEach((key) => {
            newTopics[key] = {
                topicName: key.match(regEx)[0] || '',
                displayName: data.topicAttributes[key]?.displayName || key,
                owner: data.topicAttributes[key]?.owner || ''
            };
        });
        return newTopics;
    };

    // Toggle dialog visibility
    const toggleDialog = (dialogName, dialogDefaults = {}) => {
        setDialog(dialogName);
        setDefaults(dialogDefaults);
    };

    // Edit a topic by setting the dialog and defaults
    const editTopic = (arn) => {
        setDialog('UpdateTopic');
        setDefaults(snsData.topicAttributes[arn] || {});
    };

    // Handle topic update
    const updateTopic = (topic) => {
        mutation.mutate(topic);
    };

    // Loading or error handling
    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error loading SNS data</div>;

    const topics = setupData(snsData);
    const subscriptions = snsData.subs;

    return (
        <div id="manageTopics">
            <div>
                <h2>Manage Topics</h2>
                {/* Display topics */}
                <ul>
                    {Object.keys(topics).map((arn) => (
                        <li key={arn}>
                            {topics[arn].displayName} - {topics[arn].topicName}
                            <button onClick={() => editTopic(arn)}>Edit</button>
                        </li>
                    ))}
                </ul>

                {/* Show Dialog when editing a topic */}
                {dialog === 'UpdateTopic' && (
                    <Dialog title="Update Topic" onClose={() => toggleDialog(undefined)}>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                updateTopic(defaults);
                            }}
                        >
                            <div>
                                <label>Display Name</label>
                                <input
                                    type="text"
                                    value={defaults.displayName || ''}
                                    onChange={(e) => setDefaults({ ...defaults, displayName: e.target.value })}
                                />
                            </div>
                            <TagsInput
                                name="queue_tags"
                                value={defaults.queueTags || []}
                                onChange={(tags) => setDefaults({ ...defaults, queueTags: tags })}
                            />
                            <button type="submit">Save</button>
                        </form>
                    </Dialog>
                )}
            </div>
        </div>
    );
}

export default Topics;
