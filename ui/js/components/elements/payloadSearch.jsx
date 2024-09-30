import React, { useState, useEffect, useContext } from 'react';
import { DataContext } from '../../stores/DataContext.jsx'; // Assuming DataContext for global state
import TimePicker from '../elements/timePicker.jsx';
import moment from 'moment';

const timeFormat = '/YYYY/MM/DD/HH/mm/';

const PayloadSearch = (props) => {
    const { dataStore } = useContext(DataContext); // Replacing MobX with React Context
    const [state, setState] = useState(() => init(props));

    // Initialization function
    function init(props) {
        let timestamp = '';
        let timeFrame = props.timeFrames ? props.timeFrames[0] : '5m';
        let searchText = '';

        if (props.eventId) {
            timestamp = searchText = props.eventId;
            timeFrame = '';
        } else if (!window.timePeriod?.begin || props.forceNow) {
            timeFrame = !props.timeFrames || props.timeFrames.includes('5m') ? '5m' : props.timeFrames[0];
            if (props.lastWrite) {
                let lastWrite = Date.now() - props.lastWrite;
                timestamp = determineTimestamp(lastWrite, timeFormat, props.lastWrite);
                timeFrame = determineTimeFrame(lastWrite);
            }
        } else {
            timestamp = 'z' + moment.utc(window.timePeriod.startTimestamp).format(timeFormat) + moment(window.timePeriod.startTimestamp).valueOf();
            timeFrame = '';
        }

        return {
            serverId: props.serverId,
            timestamp,
            timeFrame,
            events: false,
            eventIndex: -1,
            isSearching: true,
            searchText,
            searchEndTime: undefined,
            searchedEventsCount: 0,
            searchAttempts: 0,
        };
    }

    // Helper to determine timestamp based on time difference
    const determineTimestamp = (lastWrite, format, lastWriteTime) => {
        if (lastWrite > 7 * 60 * 60 * 1000) {
            return 'z' + moment.utc(lastWriteTime).format(format) + moment.utc();
        }
        return '';
    };

    // Helper to determine time frame based on time difference
    const determineTimeFrame = (lastWrite) => {
        if (lastWrite > 24 * 60 * 60 * 1000) return '1w';
        if (lastWrite > 6 * 60 * 60 * 1000) return '1d';
        if (lastWrite > 60 * 60 * 1000) return '6h';
        if (lastWrite > 5 * 60 * 1000) return '1h';
        return '';
    };

    useEffect(() => {
        startPayloadSearch();
    }, []);

    useEffect(() => {
        if (props.serverId !== state.serverId) {
            setState(init(props));
            startPayloadSearch();
        }
    }, [props.serverId]);

    const startPayloadSearch = () => {
        if (props.serverId) {
            setState((prevState) => ({
                ...prevState,
                events: false,
                searchedEventsCount: 0,
                eventIndex: -1,
                isSearching: true,
                resumptionToken: undefined,
                searchAttempts: 0,
                returnedEventsCount: 0,
            }));
            returnEvents([]);
            let resumptionToken = state.timestamp || '';
            if (state.timeFrame === 'all') {
                resumptionToken = '';
            } else {
                const startTime = moment.utc().subtract(state.timeFrame.split(/[^\d]/)[0], state.timeFrame.slice(-1));
                resumptionToken = 'z' + startTime.format(timeFormat) + startTime;
            }
            runPayloadSearch(props.serverId, state.searchText, resumptionToken);
        }
    };

    const runPayloadSearch = (serverId, searchText, resumptionToken, agg) => {
        const getSearchText = searchText === resumptionToken || searchText.match(/^z\/\d{4}\//) ? '' : searchText;

        fetch(`api/search/${encodeURIComponent(serverId)}/${encodeURIComponent(resumptionToken)}/${encodeURIComponent(getSearchText)}${agg ? `?agg=${encodeURIComponent(JSON.stringify(agg || {}))}` : ''}`)
            .then((response) => response.json())
            .then((result) => {
                const events = (state.events || []).concat(result.results);
                const searchedEventsCount = (state.searchedEventsCount || 0) + result.count;
                const returnedEventsCount = (state.returnedEventsCount || 0) + result.results.length;
                const searchAttempts = state.searchAttempts + 1;
                if (searchAttempts >= 6) {
                    setState({
                        events,
                        searchedEventsCount,
                        resumptionToken: result.resumptionToken || false,
                        isSearching: false,
                        searchAttempts: 0,
                        returnedEventsCount: 0,
                        agg: result.agg,
                    });
                    returnEvents(events);
                } else if (returnedEventsCount < 30) {
                    setState({
                        events,
                        searchedEventsCount,
                        resumptionToken: result.resumptionToken || false,
                        isSearching: !!result.resumptionToken,
                        searchEndTime: result.last_time,
                        searchAttempts,
                        returnedEventsCount,
                        agg: result.agg,
                    });
                    if (result.resumptionToken) {
                        runPayloadSearch(serverId, searchText, result.resumptionToken, result.agg);
                    }
                    returnEvents(events);
                } else {
                    setState({
                        events,
                        searchedEventsCount,
                        searchEndTime: result.last_time,
                        isSearching: false,
                        resumptionToken: result.resumptionToken || false,
                        searchAttempts: 0,
                        returnedEventsCount: 0,
                        agg: result.agg,
                    });
                    returnEvents(events);
                }
            })
            .catch((error) => {
                console.error('Error fetching events:', error);
            });
    };

    const returnEvents = (events) => {
        let status;
        if (state.resumptionToken || state.isSearching) {
            status = (
                <div>
                    {state.searchEndTime && `Looked through ${state.searchedEventsCount} events until ${moment(state.searchEndTime).format('YYYY-MM-DD HH:mm:ss')} `}
                    {state.isSearching ? (
                        <span>
                            {state.searchEndTime ? ' and ' : ''}
                            searching <span className="theme-spinner-tiny margin-30" />
                        </span>
                    ) : (
                        state.resumptionToken && (
                            <button type="button" className="theme-button" onClick={resumeSearch}>
                                Continue
                            </button>
                        )
                    )}
                </div>
            );
        } else if (events.length) {
            status = <div>No more events found</div>;
        } else if (props.lastWrite) {
            status = (
                <div>
                    <button type="button" className="theme-button" onClick={findRecent}>
                        Find most recent events
                    </button>
                </div>
            );
        } else {
            status = <div>No events found</div>;
        }

        props.returnEvents && props.returnEvents(events, status);
    };

    const selectTimeFrame = (timeFrame) => {
        setState((prevState) => ({
            ...prevState,
            timeFrame,
            searchEndTime: moment(),
            timestamp: undefined,
        }));
        startPayloadSearch();
    };

    const customTimeFrame = (customTime) => {
        const customTimeFormatted = moment.utc(customTime, 'MM/DD/YYYY h:mm A');
        setState((prevState) => ({
            ...prevState,
            timestamp: 'z' + customTimeFormatted.format(timeFormat) + customTimeFormatted.valueOf(),
            searchEndTime: moment.utc(customTimeFormatted),
            timeFrame: '',
        }));
        startPayloadSearch();
    };

    const saveSearchText = (event) => {
        setState((prevState) => ({ ...prevState, searchText: event.currentTarget.value }));
    };

    const clearPayloadSearch = () => {
        setState({
            resumptionToken: undefined,
            events: false,
            eventIndex: -1,
            isSearching: true,
            searchText: '',
            searchEndTime: '',
        });
        returnEvents(false);
        startPayloadSearch();
    };

    const runPayloadSearchOnEnter = (event) => {
        if (event.keyCode === 13) {
            event.preventDefault();
            const searchText = event.currentTarget.value.trim();
            if (searchText.match(/(z\/.*?)(?:$|\s)/g)) {
                const token = searchText.match(/(z\/.*?)(?:$|\s)/g)[0].replace(/\s/g, '');
                setState((prevState) => ({
                    ...prevState,
                    timestamp: token,
                    timeFrame: '',
                }));
                startPayloadSearch();
            } else {
                setState((prevState) => ({ ...prevState, searchText: event.currentTarget.value }));
                startPayloadSearch();
            }
        }
    };

    const resumeSearch = () => {
        setState((prevState) => ({ ...prevState, isSearching: true, searchAttempts: 0, returnedEventsCount: 0 }));
        runPayloadSearch(props.serverId, state.searchText, state.resumptionToken, state.agg);
    };

    const findRecent = () => {
        const timestamp = moment.utc(props.lastWrite).subtract(5, 'minutes');
        const customTimeFrame = timestamp.format();
        setState((prevState) => ({
            ...prevState,
            customTimeFrame,
            timeFrame: '',
            timestamp: 'z' + timestamp.format(timeFormat) + timestamp.valueOf(),
        }));
        startPayloadSearch();
    };

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
                        onBlur={runPayloadSearchOnEnter}
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
