import React, { useContext, useState, useEffect } from 'react';
import { DataContext } from '../../stores/DataContext.jsx'; // Assuming DataContext for global state

export function noSourceMessage(state, dataStore) {
    let noDataMessage = false;
    let noDataIcon = 'no-database.png';

    if (state.hasData) {
        if (Object.keys(dataStore.nodes).length === 0) {
            noDataMessage = [
                'No data source',
                "The data can't flow without a data source.",
                'Click the plus sign in the blue circle in the top right corner to add a data source.',
            ];
        } else if (state.userSettings.view === 'trace') {
            noDataIcon = 'no-queue.png';
            noDataMessage = [
                'No queue selected',
                'Search for a queue to find an event to trace',
            ];
        } else if (state.userSettings.view !== 'node') {
            noDataMessage = ['No nodes found', 'There are no results that match your search'];
        } else if (!state.root) {
            noDataMessage = [
                'No data node selected',
                'Please use the catalog view or start typing to search for a data node to display.',
            ];
        } else if (!dataStore.nodes[state.root]) {
            noDataMessage = [
                'Selected data node does not exist',
                'Please use the catalog view or start typing to search for a data node to display.',
            ];
        } else if (dataStore.nodes[state.root].archived) {
            noDataMessage = [
                'Selected node is archived',
                'Archived nodes can be found in the catalog. They can be unarchived from the settings tab.',
                'Or start typing to search for a data node to display.',
            ];
        }
    }

    return [noDataMessage, noDataIcon];
}

const NoSource = ({ userSettings, root, transform }) => {
    const { dataStore } = useContext(DataContext); // Replacing MobX with React Context
    const [state, setState] = useState({
        userSettings,
        root,
        hasData: dataStore.hasData,
    });

    useEffect(() => {
        setState((prevState) => ({
            ...prevState,
            userSettings,
            root,
            hasData: dataStore.hasData,
        }));
    }, [userSettings, root, dataStore.hasData]);

    let [noDataMessage, noDataIcon] = noSourceMessage(state, dataStore);

    return (
        noDataMessage ? (
            <g className="no-data-message" transform={transform}>
                <g transform="translate(-60 -240)">
                    <image href={window.leostaticcdn + 'images/icons/' + noDataIcon} width="120px" height="120px">
                        {noDataIcon === 'spinner.png' && (
                            <animateTransform
                                attributeType="xml"
                                attributeName="transform"
                                type="rotate"
                                from="0 60 60"
                                to="360 60 60"
                                dur="1s"
                                repeatCount="indefinite"
                            />
                        )}
                    </image>
                </g>
                <text>
                    <tspan x="0" dy="-1.2em">{noDataMessage[0]}</tspan>
                    <tspan x="0" dy="2em">{noDataMessage[1] || ''}</tspan>
                    <tspan x="0" dy="1.2em">{noDataMessage[2] || ''}</tspan>
                </text>
            </g>
        ) : null
    );
};

export default NoSource;
