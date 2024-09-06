import React, { useState, useEffect, useContext } from 'react';
import { DataContext } from '../../stores/DataContext'; // Assuming React Context for state management
import NodeSearch from '../elements/nodeSearch.jsx';
import NodeIcon from '../elements/nodeIcon.jsx';
import NoSource from '../elements/noSource.jsx';
import TimePeriod from '../elements/timePeriod.jsx';
import numeral from 'numeral';
import moment from 'moment';
import humanize from '../../../../lib/humanize.js';

function ListView({ searches, userSettings }) {
    const { state, dispatch } = useContext(DataContext); // Assuming use of React Context
    const [index, setIndex] = useState(-1);
    const [startRow, setStartRow] = useState(0);
    const [archive, setArchive] = useState(false);
    const [tableData, setTableData] = useState([]);
    const [visibleRowCount] = useState(100); // Assuming this is fixed
    const [rowHeight, setRowHeight] = useState(57);
    const [show, setShow] = useState(['queue', 'bot', 'system']);
    const [bot, setBot] = useState([]);
    const [system, setSystem] = useState([]);
    const [statuses, setStatuses] = useState(['!archived']);
    const [searchResults, setSearchResults] = useState([]);
    const [scrolled, setScrolled] = useState(false);

    const dataStore = state.dataStore; // Assuming dataStore is part of the context state

    useEffect(() => {
        if (!dataStore.hasData) {
            dataStore.getStats();
        }
    }, [dataStore]);

    useEffect(() => {
        const filteredTableData = getFilteredTableData({ show });
        setTableData(filteredTableData);
        adjustScrollFiller();
    }, [show, bot, system, statuses, startRow, searchResults]);

    const adjustScrollFiller = () => {
        const $element = document.querySelector('.bot-list');
        const rowHeightValue = ($element.querySelector('.filler-top').nextElementSibling?.clientHeight || 55);
        setRowHeight(rowHeightValue);
        $element.querySelector('.filler-top').style.height = `${rowHeightValue * startRow}px`;
        $element.querySelector('.filler-bottom').style.height = `${rowHeightValue * (tableData.length - startRow - visibleRowCount)}px`;
    };

    const handleScroll = () => {
        const scrollTop = document.querySelector('.bot-list table').scrollTop;
        const newStartRow = Math.floor((scrollTop / (rowHeight * (visibleRowCount / 3))) * (visibleRowCount / 3)) || 0;
        if (newStartRow !== startRow) {
            setStartRow(newStartRow);
        }
    };

    const selectSort = (index) => {
        setIndex(-1);
        searches.current.sort = {
            direction: searches.current.sort.index === index && searches.current.sort.direction === 'asc' ? 'desc' : 'asc',
            index: index
        };
        const newTableData = getFilteredTableData({ show });
        setTableData(newTableData);
        setTimeout(() => setScrolled(true), 0);
    };

    const getFilteredTableData = (filters, filteredIds = searchResults) => {
        if (!dataStore.hasData) return [];

        const columns = (node) => {
            const source_lag = node.queues?.read?.last_source_lag || 0;
            const write_lag = node.queues?.write?.last_write_lag || 0;
            return [
                node.label,
                node.tags,
                '',
                node.description,
                { bot: node => node.last_run.start, queue: node => node.latest_write, system: node => node.last_in_time }[node.type](node),
                node.errors,
                { bot: node => node.queues.read.events, queue: node => node.bots.read.events, system: node => node.bots.read.events }[node.type](node),
                { bot: node => node.queues.write.events, queue: node => node.bots.write.events, system: node => node.bots.write.events }[node.type](node),
                node.details.executions,
                source_lag,
                write_lag
            ];
        };

        return Object.keys(dataStore.nodes)
            .filter(id => {
                const node = dataStore.nodes[id] || {};
                if (
                    (node && (
                        (node.status === 'archived' && !archive) ||
                        (node.type === 'system' && system.length && !system.includes(node.settings?.system)) ||
                        (node.type === 'bot' && bot.length && !bot.includes((window.templates[node.templateId]?.name || '')))
                    )) ||
                    (filteredIds && !filteredIds.includes(id))
                ) {
                    return false;
                }
                return filters.show.includes(node.type);
            })
            .map(id => {
                const node = dataStore.nodes[id];
                return {
                    id: id,
                    type: node.type,
                    label: node.label,
                    status: node.status,
                    system: node.system,
                    templateId: node.templateId,
                    columns: columns(node)
                };
            })
            .sort((a, b) => {
                const first = searches.current.sort.direction === 'asc' ? a.columns[searches.current.sort.index] : b.columns[searches.current.sort.index];
                const second = searches.current.sort.direction === 'asc' ? b.columns[searches.current.sort.index] : a.columns[searches.current.sort.index];
                return typeof first === 'number' ? first - second : (first || '').localeCompare(second || '');
            });
    };

    return (
        <div className="list-view">
            <div className="top-controls button-group">
                <NodeSearch
                    className="control"
                    searchResults={(results, text) => {
                        setSearchResults(results);
                        searches.current.text = text;
                    }}
                    upAndDown={(direction) => {}}
                    showArchived={archive}
                    placeholder="filter..."
                    searchText={searches.current.text}
                />
                {/* Additional controls */}
            </div>

            <div className="bot-list theme-table-fixed-header hide-columns-2-3-4-5-7-8">
                <table className="theme-table-overflow-hidden" onScroll={handleScroll}>
                    <thead className={`active ${userSettings.list}`}>
                        <tr>
                            {['Name', 'Actions', 'Last Action', '# Errors', '# Reads', '# Writes', '# Executions', 'Source Lag', 'Write Lag'].map((columnHeader, index) => (
                                <th key={index} className={`sortable ${searches.current.sort.index === index ? searches.current.sort.direction : ''}`} onClick={() => selectSort(index)}>
                                    {columnHeader}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="filler-top"><td /><td /><td /><td /><td /><td /><td /><td /><td /></tr>
                        {tableData.slice(startRow, startRow + visibleRowCount).map((tableRow, key) => (
                            <tr key={tableRow.id} className={((userSettings.selected || []).includes(tableRow.id) ? 'active' : '')}>
                                <td onClick={() => { /* Node selection logic */ }}>
                                    <NodeIcon node={tableRow.id} />
                                    <span>{tableRow.columns[0]}</span>
                                </td>
                                {/* Other table columns */}
                            </tr>
                        ))}
                        <tr className="filler-bottom"><td /><td /><td /><td /><td /><td /><td /><td /><td /></tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ListView;
