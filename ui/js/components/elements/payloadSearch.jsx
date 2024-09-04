import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import TimePicker from '../elements/timePicker.jsx';
import moment from 'moment';

const timeFormat = '/YYYY/MM/DD/HH/mm/';

const fetchPayloadSearch = async ({ queryKey }) => {
  const [serverId, searchText, resumptionToken] = queryKey;

  let getSearchText = searchText === resumptionToken || searchText.match(/^z\/\d{4}\//) ? '' : searchText;

  if (searchText.match(/(^z\/.*?)(?:$|\s)/g)) {
    const token = searchText.match(/(^z\/.*?)(?:$|\s)/g)[0];
    getSearchText = searchText.replace(token, '');
  }

  const response = await fetch(
    `api/search/${encodeURIComponent(serverId)}/${encodeURIComponent(resumptionToken)}/${encodeURIComponent(getSearchText)}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch search results');
  }
  return response.json();
};

const PayloadSearch = (props) => {
  const [state, setState] = useState(init(props));

  function init(props) {
    let timestamp = '';
    let timeFrame = props.timeFrames ? props.timeFrames[0] : '5m';
    let searchText = '';

    if (props.eventId) {
      timestamp = searchText = props.eventId;
      timeFrame = '';
    } else if (!window.timePeriod?.begin || props.forceNow) {
      timestamp = '';
      timeFrame = !props.timeFrames || props.timeFrames.indexOf('5m') !== -1 ? '5m' : props.timeFrames[0];
      if (props.lastWrite) {
        let lastWrite = Date.now() - props.lastWrite;
        if (lastWrite > 7 * 60 * 60 * 1000) {
          timestamp = 'z' + moment.utc(props.lastWrite).format(timeFormat) + moment.utc();
        } else if (lastWrite > 24 * 60 * 60 * 1000) {
          timeFrame = '1w';
        } else if (lastWrite > 6 * 60 * 60 * 1000) {
          timeFrame = '1d';
        } else if (lastWrite > 60 * 60 * 1000) {
          timeFrame = '6h';
        } else if (lastWrite > 5 * 60 * 1000) {
          timeFrame = '1h';
        }
      }
    } else {
      timestamp = 'z' + moment.utc(window.timePeriod.startTimestamp).format(timeFormat) + moment(window.timePeriod.startTimestamp).valueOf();
      timeFrame = '';
    }

    return {
      serverId: props.serverId,
      timestamp,
      timeFrame,
      events: [],
      searchText,
      searchEndTime: undefined,
    };
  }

  // Fetching the payload search data with TanStack Query
  const { data, isError, isLoading, fetchNextPage, refetch } = useQuery(
    ['payloadSearch', state.serverId, state.searchText, state.timestamp],
    fetchPayloadSearch,
    {
      enabled: !!state.serverId, // Only run query if the serverId exists
      refetchOnWindowFocus: false,
      retry: false,
    }
  );

  function selectTimeFrame(timeFrame) {
    setState({
      ...state,
      timeFrame,
      searchEndTime: moment(),
      timestamp: undefined,
    });
    refetch();
  }

  function customTimeFrame(customTime) {
    const customTimeValue = moment.utc(customTime, 'MM/DD/YYYY h:mm A');
    setState({
      ...state,
      timestamp: 'z' + customTimeValue.format(timeFormat) + customTimeValue.valueOf(),
      searchEndTime: moment.utc(customTimeValue),
      timeFrame: '',
    });
    refetch();
  }

  function saveSearchText(event) {
    setState({ ...state, searchText: event.currentTarget.value });
  }

  function clearPayloadSearch() {
    setState({
      ...state,
      events: [],
      searchText: '',
      searchEndTime: '',
    });
    refetch();
  }

  function runPayloadSearchOnEnter(event) {
    if (event.keyCode === 13) {
      event.preventDefault();
      const searchText = event.currentTarget.value.trim();
      if (searchText.match(/(z\/.*?)(?:$|\s)/g)) {
        const token = searchText.match(/(z\/.*?)(?:$|\s)/g)[0].replace(/\s/g, '');
        setState({
          ...state,
          timestamp: token,
          timeFrame: '',
        });
        refetch();
      } else {
        setState({ ...state, searchText: event.currentTarget.value });
        refetch();
      }
    }
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error loading data...</div>;
  }

  return (
    <div className="timeframe-search-bar">
      {!props.hideSearch && (
        <div className="left-side">
          <input
            name="search"
            placeholder="search"
            value={state.searchText}
            onChange={saveSearchText}
            onKeyDown={runPayloadSearchOnEnter}
            autoComplete="off"
          />
          {state.searchText && <i className="icon-cancel clear-search-text" onClick={clearPayloadSearch} />}
        </div>
      )}
      <div className="right-side">
        <TimePicker
          timeFrames={props.timeFrames}
          active={state.timeFrame}
          customTimeFrame={state.customTimeFrame}
          onClick={selectTimeFrame}
          datePicker={customTimeFrame}
        />
      </div>
    </div>
  );
};

export default PayloadSearch;
