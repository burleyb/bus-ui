import React, { useState, useEffect, useContext } from 'react';
import { useData } from '../../stores/DataContext.jsx'; // Assuming use of React Context
import axios from 'axios';
import { LeoKit } from '../dialogs/LeoKit.jsx';
import TagsInput from '../elements/tagsInput.jsx';
import NodeSearch from '../elements/nodeSearch.jsx';
import MuteButton from '../elements/muteButton.jsx';
import moment from 'moment';
import numeral from 'numeral';
import humanize from '../utils/humanize.js';

function DashboardView() {
    const state = useData(); 
    const [showSearchBox, setShowSearchBox] = useState(false);
    const [tagCards, setTagCards] = useState(JSON.parse(localStorage.getItem('tagCards') || '{}'));
    const [data, setData] = useState([]);
    const [muted, setMuted] = useState(false);

    useEffect(() => {
        // Fetch initial data
        if (!state.hasData) {
            state.fetchStats();
        }
        adjustScrollFiller();
        updateDonuts();
    }, [data]);

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
        state.setSortBy(sortBy);
        state.setSortDir(sortDirection);
        setData(state.sortAlarmed());
    };

    const filterByTag = (tagName) => {
        state.setFilterByTag( tagName === state.filterByTag ? undefined : tagName );
    };

    const refreshData = async (event) => {
        const button = event.currentTarget;
        try {
            button.classList.add('loading');
            await state.fetchStats();
        } finally {
            button.classList.remove('loading');
        }
    };

    const adjustScrollFiller = () => {
        // Select the bot-list element
        const element = document.querySelector('.bot-list');
        if (!element) return; // Exit if the element is not found
    
        // Find the height of the next sibling element after filler-top or default to 55
        const rowHeight = element.querySelector('.filler-top')?.nextElementSibling?.clientHeight || 55;
    
        // Set the height of the filler-top element
        const fillerTop = element.querySelector('.filler-top');
        if (fillerTop) {
            fillerTop.style.height = `${rowHeight}px`;
        }
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
