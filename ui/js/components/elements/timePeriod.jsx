import React, { useState, useEffect, useContext } from 'react';
import moment from 'moment';
import { DataContext } from '../../stores/DataContext.jsx'; // Assuming DataContext for global state

const TimePeriod = (props) => {
    const { changeTimePeriod, getStats } = useContext(DataContext); // Using React Context instead of Redux

    const apiFormat = props.apiFormat || 'YYYY-MM-DD HH:mm:ssZ';
    const displayFormat = props.displayFormat || 'M/DD/YYYY h:mm A';

    const [begin, setBegin] = useState((props.defaults && props.defaults.begin) ? props.defaults.begin : undefined);
    const [end, setEnd] = useState((props.defaults && props.defaults.end) ? props.defaults.end : undefined);
    const [interval, setInterval] = useState((props.defaults && props.defaults.interval) ? props.defaults.interval : 'minute_15');
    const [updated, setUpdated] = useState(Date.now());

    const intervals = {
        "minute_1": { step: 1, unit: "m", label: '1m', subunit: 's' },
        "minute_5": { step: 5, unit: "m", label: '5m', subunit: 'm' },
        "minute_15": { step: 15, unit: 'm', label: '15m', substep: 1, subunit: 'm' },
        "hour": { step: 1, unit: "h", label: '1hr', substep: 15, subunit: 'm' },
        "hour_6": { step: 6, unit: "h", label: '6hr', substep: 1, subunit: 'm' },
        "day": { step: 1, unit: "d", label: '1d', substep: 1, subunit: 'h' },
        "week": { step: 1, unit: "w", label: '1w', subunit: 'd' },
    };

    // Parse date with moment
    const dateParse = (date) => {
        const parsed = moment(Date.parse(date));
        return parsed.isValid() ? parsed : moment();
    };

    // Trigger on change
    const triggerOnChange = () => {
        const data = {
            interval,
            begin,
            end,
            range: intervals[interval],
            endFormatted: () => {
                return dateParse(end).endOf(intervals[interval].unit).format(apiFormat);
            }
        };

        // Update global timePeriod state
        changeTimePeriod(data.begin, data.end, data.interval);
        getStats();
    };

    // Update the interval every minute when end is undefined
    useEffect(() => {
        const updateInterval = setInterval(() => {
            if (!end) {
                setUpdated(Date.now());
            }
        }, 60000);

        return () => clearInterval(updateInterval);
    }, [end]);

    // Trigger on change when component is mounted or interval changes
    useEffect(() => {
        triggerOnChange();
    }, [interval, begin, end]);

    // Go to the current time (now)
    const goToNow = () => {
        setBegin(undefined);
        setEnd(undefined);
        triggerOnChange();
    };

    // Go backward based on the current interval
    const goBackward = () => {
        const intervalData = intervals[interval];
        const newBegin = dateParse(begin).subtract(intervalData.step, intervalData.unit).format(apiFormat);
        const newEnd = dateParse(end).subtract(intervalData.step, intervalData.unit).format(apiFormat);
        setBegin(newBegin);
        setEnd(newEnd);
        triggerOnChange();
    };

    // Go forward based on the current interval
    const goForward = () => {
        const intervalData = intervals[interval];
        const newBegin = dateParse(begin).add(intervalData.step, intervalData.unit).format(apiFormat);
        const newEnd = dateParse(end).add(intervalData.step, intervalData.unit).format(apiFormat);

        if (dateParse(newBegin).isSameOrAfter(moment(), intervalData.unit) || dateParse(newEnd).isSameOrAfter(moment(), intervalData.unit)) {
            setBegin(undefined);
            setEnd(undefined);
        } else {
            setBegin(newBegin);
            setEnd(newEnd);
        }

        triggerOnChange();
    };

    // Custom time frame selected through a date picker (if implemented)
    const customTimeFrame = (customEnd) => {
        setEnd(customEnd);
        triggerOnChange();
    };

    // Set the field (interval, begin, end) based on user input
    const setField = (field, value) => {
        if (field === 'interval') {
            setInterval(value);
        } else if (field === 'end') {
            setEnd(value);
        }
        triggerOnChange();
    };

    // Format the display of the end time
    const formattedEnd = end ? dateParse(end).format(displayFormat) : 'Now';

    return (
        <div className={`theme-time-picker has-date-picker ${props.className || ''}`}>
            {!props.vertical && <i className="icon-left-open" onClick={goBackward} />}
            
            <span className="date-interval-date" title="click to change">
                {formattedEnd}
            </span>

            <span className="input-group time" id="mainDateTimePicker">
                <input type="hidden" name="customTimeFrame" value={end || ''} />
                <i className="icon-calendar-empty datepickerbutton" />
                <div className="mask" onClick={() => customTimeFrame(moment().format(apiFormat))}></div>
            </span>

            <i className="icon-right-open" disabled={!end} onClick={goForward} />
            <div className="wrapper">
                {Object.keys(intervals).map((key) => (
                    <span key={key} className={`time ${interval === key ? 'active' : ''}`} onClick={() => setField('interval', key)}>
                        {intervals[key].label}
                    </span>
                ))}
            </div>
            <span className="now-button" disabled={!end} onClick={goToNow}>Now</span>
        </div>
    );
};

export default TimePeriod;
