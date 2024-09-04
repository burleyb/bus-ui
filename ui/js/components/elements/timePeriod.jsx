import React, { useState, useEffect } from 'react';
import moment from 'moment';

const TimePeriod = (props) => {
    const apiFormat = props.apiFormat || 'YYYY-MM-DD HH:mm:ssZ';
    const displayFormat = props.displayFormat || 'M/DD/YYYY h:mm A';

    const [begin, setBegin] = useState(props.defaults?.begin || undefined);
    const [end, setEnd] = useState(props.defaults?.end || undefined);
    const [interval, setInterval] = useState(props.defaults?.interval || 'minute_15');
    const [editField, setEditField] = useState(false);

    const intervals = {
        "minute_1": { step: 1, unit: "m", label: '1m', subunit: 's' },
        "minute_5": { step: 5, unit: "m", label: '5m', subunit: 'm' },
        "minute_15": { step: 15, unit: 'm', label: '15m', substep: 1, subunit: 'm' },
        "hour": { step: 1, unit: "h", label: '1hr', substep: 15, subunit: 'm' },
        "hour_6": { step: 6, unit: "h", label: '6hr', substep: 1, subunit: 'm' },
        "day": { step: 1, unit: "d", label: '1d', substep: 1, subunit: 'h' },
        "week": { step: 1, unit: "w", label: '1w', subunit: 'd' },
    };

    useEffect(() => {
        // Setting initial window time period on mount
        window.timePeriod = {
            interval: interval,
            begin: begin,
            end: end,
            range: intervals[interval],
        };

        const updateInterval = setInterval(() => {
            if (!end) {
                setEnd(Date.now());
            }
        }, 60000);

        return () => clearInterval(updateInterval); // Cleanup interval on unmount
    }, [begin, end, interval]);

    const dateParse = (date) => {
        const parsed = moment(Date.parse(date));
        return parsed.isValid() ? parsed : moment();
    };

    const triggerOnChange = () => {
        const data = {
            interval,
            begin,
            end,
            range: intervals[interval],
            endFormatted: () => dateParse(end).endOf(intervals[interval].unit).format(apiFormat),
        };

        window.timePeriod = data;
        props.onChange && props.onChange(data); // Call parent's onChange if provided
    };

    const setField = (field, value) => {
        if (field === 'interval') {
            const intervalObj = intervals[value];
            const updatedBegin = dateParse(end).subtract(intervalObj.step, intervalObj.unit).format(apiFormat);
            setBegin(updatedBegin);
        }

        if (field === 'end') {
            const intervalObj = intervals[interval];
            const updatedBegin = dateParse(value).subtract(intervalObj.step, intervalObj.unit).format(apiFormat);
            setBegin(updatedBegin);
            setEnd(dateParse(value).format(apiFormat));
        }

        setEditField(false);
        triggerOnChange();
    };

    const goToNow = () => {
        setBegin(undefined);
        setEnd(undefined);
        triggerOnChange();
    };

    const goBackward = () => {
        const intervalObj = intervals[interval];
        const updatedBegin = dateParse(begin).subtract(intervalObj.step, intervalObj.unit).format(apiFormat);
        const updatedEnd = dateParse(end).subtract(intervalObj.step, intervalObj.unit).format(apiFormat);

        setBegin(updatedBegin);
        setEnd(updatedEnd);
        triggerOnChange();
    };

    const goForward = () => {
        const intervalObj = intervals[interval];
        const updatedBegin = dateParse(begin).add(intervalObj.step, intervalObj.unit).format(apiFormat);
        const updatedEnd = dateParse(end).add(intervalObj.step, intervalObj.unit).format(apiFormat);

        if (dateParse(updatedEnd).isSameOrAfter(moment())) {
            setBegin(undefined);
            setEnd(undefined);
        } else {
            setBegin(updatedBegin);
            setEnd(updatedEnd);
        }
        triggerOnChange();
    };

    const endFormatted = end ? dateParse(end).format(displayFormat) : 'Now';

    return (
        <div className={`theme-time-picker has-date-picker ${props.className || ''}`}>
            {!props.vertical && <i className="icon-left-open" onClick={goBackward} />}

            {editField === 'end' ? (
                <input
                    className="end-time-input theme-form-input"
                    onBlur={() => setField('end', end)}
                    onKeyDown={(event) => event.keyCode === 13 && setField('end', event.currentTarget.value)}
                    defaultValue={endFormatted}
                />
            ) : (
                <span className="date-interval-date" title="click to change" onClick={() => setEditField('end')}>
                    {endFormatted}
                </span>
            )}

            <i className="icon-right-open" disabled={!end} onClick={goForward} />
            <div className="wrapper">
                {Object.keys(intervals).map((key) => (
                    <span key={key} className={`time${interval === key ? ' active' : ''}`} onClick={() => setField('interval', key)}>
                        {intervals[key].label}
                    </span>
                ))}
            </div>

            <span className="now-button" disabled={!end} onClick={goToNow}>
                Now
            </span>
        </div>
    );
};

export default TimePeriod;
