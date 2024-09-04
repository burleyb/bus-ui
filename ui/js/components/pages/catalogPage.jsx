import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import NodeSearch from '../elements/nodeSearch.jsx';
import NodeIcon from '../elements/nodeIcon.jsx';
import NoSource from '../elements/noSource.jsx';
import TimePeriod from '../elements/timePeriod.jsx';
import humanize from '../../../../lib/humanize.js';
import numeral from 'numeral';
import moment from 'moment';

const fetchNodeStats = async () => {
  const response = await fetch('/api/nodestats'); // Replace with actual API
  return response.json();
};

const ListView = ({ searches }) => {
  const [state, setState] = useState({
    show: ['queue', 'bot', 'system'],
    bot: [],
    system: [],
    statuses: ['!archived'],
    startRow: 0,
    archive: false,
    searchResults: [],
    text: '',
  });

  const { data: nodeData, isLoading } = useQuery(['nodeStats'], fetchNodeStats);

  const rowHeight = 57;
  const visibleRowCount = 100;
  const [tableData, setTableData] = useState([]);
  const [sortSettings, setSortSettings] = useState({ direction: 'asc', index: 0 });

  useEffect(() => {
    if (nodeData) {
      setTableData(getFilteredTableData());
    }
  }, [nodeData, state.show, sortSettings]);

  const getFilteredTableData = () => {
    if (!nodeData) return [];

    const columns = (node) => {
      const source_lag = (node.queues?.read?.last_source_lag) || 0;
      const write_lag = (node.queues?.write?.last_write_lag) || 0;
      return [
        node.label,
        node.tags,
        '',
        node.description,
        {
          bot: (node) => node.last_run.start,
          queue: (node) => node.latest_write,
          system: (node) => node.last_in_time,
        }[node.type](node),
        node.errors,
        {
          bot: (node) => node.queues.read.events,
          queue: (node) => node.bots.read.events,
          system: (node) => node.bots.read.events,
        }[node.type](node),
        {
          bot: (node) => node.queues.write.events,
          queue: (node) => node.bots.write.events,
          system: (node) => node.bots.write.events,
        }[node.type](node),
        node.details.executions,
        source_lag,
        write_lag,
      ];
    };

    const filteredData = Object.keys(nodeData.nodes)
      .filter((id) => {
        const node = nodeData.nodes[id];
        return (
          state.show.includes(node.type) &&
          !(
            (node.status === 'archived' && !state.archive) ||
            (state.system.length && node.type === 'system' && !state.system.includes(node.settings?.system)) ||
            (state.bot.length && node.type === 'bot' && !state.bot.includes(node.templateId))
          )
        );
      })
      .map((id) => {
        const node = nodeData.nodes[id];
        return {
          id,
          type: node.type,
          label: node.label,
          status: node.status,
          system: node.system,
          templateId: node.templateId,
          columns: columns(node),
        };
      });

    filteredData.sort((a, b) => {
      const first = sortSettings.direction === 'asc' ? a.columns[sortSettings.index] : b.columns[sortSettings.index];
      const second = sortSettings.direction === 'asc' ? b.columns[sortSettings.index] : a.columns[sortSettings.index];
      return typeof first === 'number' ? first - second : (first || '').localeCompare(second || '');
    });

    return filteredData;
  };

  const handleSort = (index) => {
    setSortSettings((prev) => ({
      direction: prev.index === index && prev.direction === 'asc' ? 'desc' : 'asc',
      index,
    }));
  };

  const handleSearch = (results, searchText) => {
    setState((prevState) => ({
      ...prevState,
      searchResults: results,
      text: searchText,
    }));
  };

  const toggleFilter = (type) => {
    setState((prevState) => {
      const show = prevState.show.includes(type) ? prevState.show.filter((t) => t !== type) : [...prevState.show, type];
      return { ...prevState, show };
    });
  };

  const renderTableRows = () => {
    return tableData.slice(state.startRow, state.startRow + visibleRowCount).map((row) => (
      <tr key={row.id} className={row.status === 'paused' ? 'opacity-6' : ''}>
        <td onClick={() => {/* Add row click logic */}}>
          <NodeIcon node={row.id} />
          <span>{row.columns[0]}</span>
        </td>
        {/* Add other columns */}
      </tr>
    ));
  };

  if (isLoading) {
    return <div className="theme-spinner-large"></div>;
  }

  return (
    <div className="list-view">
      <div className="top-controls button-group">
        <NodeSearch className="control" searchResults={handleSearch} showArchived={state.archive} placeholder="filter..." searchText={state.text} />
        {/* Other filter controls */}
      </div>

      <div className="bot-list theme-table-fixed-header">
        <table className="theme-table-overflow-hidden">
          <thead>
            <tr>
              {['Name', 'Actions', 'Last Action', '# Errors', '# Reads', '# Writes', '# Executions', 'Source Lag', 'Write Lag'].map((col, i) => (
                <th key={i} className={sortSettings.index === i ? sortSettings.direction : ''} onClick={() => handleSort(i)}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{renderTableRows()}</tbody>
        </table>
      </div>
    </div>
  );
};

export default ListView;
