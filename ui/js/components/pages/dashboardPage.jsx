import React, { useState, useEffect, useContext } from 'react';
import { DataContext } from '../../../stores/DataContext'; // Assuming use of React Context
import axios from 'axios';
import LeoKit from 'leo-kit';
import TagsInput from '../elements/tagsInput.jsx';
import NodeSearch from '../elements/nodeSearch.jsx';
import MuteButton from '../elements/muteButton.jsx';
import moment from 'moment';
import numeral from 'numeral';
import humanize from '../../../../lib/humanize.js';

function DashboardView() {
    const { state, dispatch } = useContext(DataContext); // Assuming React Context for global state
    const [showSearchBox, setShowSearchBox] = useState(false);
    const [tagCards, setTagCards] = useState(JSON.parse(localStorage.getItem('tagCards') || '{}'));
    const [data, setData] = useState([]);
    const [muted, setMuted] = useState(false);

    useEffect(() => {
        // Fetch initial data
        if (!state.hasData) {
            fetchStats();
        }
        adjustScrollFiller();
        updateDonuts();
    }, [data]);

    const fetchStats = async () => {
        try {
            const response = await axios.get('/api/stats');
            setData(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const updateDonuts = () => {
        // Assuming this updates donut charts using charting library
        const charts = document.querySelectorAll('.donut-chart'); 
        charts.forEach(chart => {
            const value = chart.dataset.value;
            const percentage = Math.round(value * 100); // Calculate percentage or other logic
            chart.style.strokeDasharray = `${percentage}, 100`;
            chart.querySelector('.percentage-text').textContent = `${percentage}%`;
        });
    };

    const showDialog = (dialogName) => {
        if (dialogName === 'addCard') {
            LeoKit.prompt('Add Card', 'Select tag', state.availableTags, {
                OK: (formData) => {
                    const tagName = formData.prompt_value;
                    if (!(tagName in tagCards)) {
                        const updatedTagCards = { ...tagCards, [tagName]: {} };
                        setTagCards(updatedTagCards);
                        localStorage.setItem('tagCards', JSON.stringify(updatedTagCards));
                    }
                },
                Cancel: false,
            });
        }
    };

    const deleteCard = (tagName, event) => {
        event.stopPropagation();
        LeoKit.confirm(`Delete "${tagName}"?`, () => {
            const updatedTagCards = { ...tagCards };
            delete updatedTagCards[tagName];
            setTagCards(updatedTagCards);
            localStorage.setItem('tagCards', JSON.stringify(updatedTagCards));
        });
    };

    const sorting = (sortBy) => {
        const sortDirection = state.sortBy === sortBy && state.sortDir !== 'asc' ? 'asc' : 'desc';
        dispatch({ type: 'SET_SORT', payload: { sortBy, sortDir: sortDirection } });
        setData(state.sortAlarmed());
    };

    const filterByTag = (tagName) => {
        dispatch({ type: 'SET_FILTER_BY_TAG', payload: tagName === state.filterByTag ? undefined : tagName });
    };

    const refreshData = async (event) => {
        const button = event.currentTarget;
        try {
            button.classList.add('loading');
            await fetchStats();
        } finally {
            button.classList.remove('loading');
        }
    };

    const adjustScrollFiller = () => {
        const $element = document.querySelector('.bot-list');
        const rowHeight = $element.querySelector('.filler-top').nextElementSibling?.clientHeight || 55;
        $element.querySelector('.filler-top').style.height = `${rowHeight}px`;
    };

    const toggleSearchBox = (show) => {
        setShowSearchBox(show);
        if (show) {
            document.querySelector('.searchBox').focus();
        }
    };

    return (
        <div className="dashboard-page">
            <div className="top-controls button-group">
                <NodeSearch 
                    className="control" 
                    showArchived={state.archive} 
                    searchText={state.text} 
                    searchResults={setData} 
                    placeholder="filter..." 
                />
                
                <MuteButton muted={muted} onClick={() => setMuted(!muted)} />

                <button className="refresh-button" onClick={refreshData}>
                    Refresh Data
                </button>

                <button className="add-card-button" onClick={() => showDialog('addCard')}>
                    Add Card
                </button>
            </div>

            <div className="bot-list theme-table-fixed-header">
                <table className="theme-table-overflow-hidden">
                    <thead>
                        <tr>
                            <th onClick={() => sorting('name')}>Name</th>
                            <th onClick={() => sorting('status')}>Status</th>
                            <th onClick={() => sorting('lastAction')}>Last Action</th>
                            <th onClick={() => sorting('errors')}>Errors</th>
                            <th onClick={() => sorting('reads')}>Reads</th>
                            <th onClick={() => sorting('writes')}>Writes</th>
                            <th onClick={() => sorting('executions')}>Executions</th>
                            <th onClick={() => sorting('sourceLag')}>Source Lag</th>
                            <th onClick={() => sorting('writeLag')}>Write Lag</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, index) => (
                            <tr key={index}>
                                <td>{item.name}</td>
                                <td>{item.status}</td>
                                <td>{moment(item.lastAction).fromNow()}</td>
                                <td>{numeral(item.errors).format('0,0')}</td>
                                <td>{numeral(item.reads).format('0,0')}</td>
                                <td>{numeral(item.writes).format('0,0')}</td>
                                <td>{numeral(item.executions).format('0,0')}</td>
                                <td>{humanize(item.sourceLag)}</td>
                                <td>{humanize(item.writeLag)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default DashboardView;
