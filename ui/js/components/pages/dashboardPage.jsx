import React, { useState, useEffect } from 'react';
import moment from 'moment';
import NodeIcon from '../elements/nodeIcon.jsx';
import MuteButton from '../elements/muteButton.jsx';
import TimePeriod from '../elements/timePeriod.jsx';
import NodeSearch from '../elements/nodeSearch.jsx';
import { useQuery } from '@tanstack/react-query'; // Using TanStack Query for data fetching
import { fetchStats } from '../../api'; // Assumes you have a fetch function

const DashboardView = () => {
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);

  const { data: stats, isLoading, refetch } = useQuery(['stats'], fetchStats); // TanStack Query for fetching stats

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.target.tagName !== 'INPUT' && event.target.tagName !== 'TEXTAREA') {
        if ((65 <= event.keyCode && event.keyCode <= 90) || (48 <= event.keyCode && event.keyCode <= 57)) {
          setShowSearchBox(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown); // Cleanup event listener
  }, []);

  const alarmedColumns = {
    readLag: 'Source Lag',
    writeLag: 'Write Lag',
    errorCount: 'Errors',
  };

  const toggleSearchBox = () => setShowSearchBox((prev) => !prev);

  const handleRefresh = () => {
    refetch();
  };

  const handleNodeSelection = (node) => {
    setSelectedNode(node); // Select a node to view more details
  };

  if (isLoading) return <div className="theme-spinner-large" />; // Show a spinner while loading

  const alarmedPercent = (stats?.alarmedCount / stats?.activeBotCount) * 100 || 0;
  const activePercent = 100 - alarmedPercent;

  return (
    <div className="dashboard-view">
      <div className="width82 order-1">
        <div className="theme-panel" style={{ margin: '0 20px 20px 0' }}>
          <div>
            <div className="theme-icon-group pull-left control searchDisappear">
              {showSearchBox ? (
                <NodeSearch toggleSearchBox={toggleSearchBox} className="black left-icon" placeholder="Search..." />
              ) : (
                <div className="theme-autocomplete black left-icon">
                  <input
                    type="search"
                    className="searchBox theme-form-input"
                    placeholder="Search..."
                    onClick={toggleSearchBox}
                  />
                  <i className="search-icon icon-search" />
                </div>
              )}
            </div>

            <button type="button" className="theme-button-small pull-right" onClick={handleRefresh}>
              <i className="icon-refresh" /> Refresh
            </button>

            <TimePeriod
              className="control pull-right timePickerDisappear"
              intervals={['minute_15', 'hour', 'hour_6', 'day']}
              onChange={() => refetch()} // Refetch data on time period change
              singleField="true"
              spread="false"
              pauseButton="true"
            />
          </div>

          <div className="current-status">
            <div>
              <div className="theme-card">
                <div className="theme-card-title">Total Events</div>
                <div className="big-number green">{stats?.totalEvents?.toLocaleString()}</div>
              </div>

              <div className="theme-card">
                <div className="theme-card-title">Bots</div>
                <div
                  className="js-circle-chart"
                  data-parts={JSON.stringify(alarmedPercent ? { '#EF6374': alarmedPercent, '#71AA30': activePercent } : { '#71AA30': activePercent })}
                >
                  {stats?.alarmedCount ? (
                    <div>
                      <span className="big-number red">{stats.alarmedCount}</span>
                      <span className="text-sub"> / {stats.activeBotCount}</span>
                      <div className="theme-big-label">alarmed</div>
                    </div>
                  ) : (
                    <span className="big-number green">{stats?.activeBotCount}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="width82 dashboard-table-wrapper order-2">
        <div className="theme-panel overflow-hidden flex-column height-1-1 border-box">
          <div style={{ paddingBottom: 20 }}>
            <span className="theme-title red">Muted & Alarmed Bots</span>
            <span className="theme-red-bubble" data-count={stats?.alarmedBots?.length || 0}></span>
          </div>

          <div className="theme-table-fixed-header-wrap">
            <table>
              <thead>
                <tr>
                  <th className="text-left wide-column">Bot Name</th>
                  <th className="two-icons"></th>
                  {Object.values(alarmedColumns).map((label, key) => (
                    <th key={key} className="text-center">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats?.alarmedBots?.map((bot, index) => (
                  <tr key={index}>
                    <td className="wide-column position-relative pointer" onClick={() => handleNodeSelection(bot)}>
                      <NodeIcon node={bot.id} size="32px" className="dashBotImg" />
                      <span className="text-ellipsis">{bot.label}</span>
                    </td>
                    <td className="two-icons">
                      <MuteButton mute={bot.muted} id={bot.id} />
                    </td>
                    {Object.keys(alarmedColumns).map((key) => (
                      <td key={key} className="position-relative">
                        <div>{bot[key]}</div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
