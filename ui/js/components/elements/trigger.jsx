import React, { useState, useEffect } from 'react';
import NodeSearch from '../elements/nodeSearch.jsx';

const triggerUnits = {
    minute: '^\\d+ \\*\\/\\d+(?: \\*){4}$',
    hour: '^(?:\\d+ ){2}\\*\\/\\d+(?: \\*){3}$',
    day: '^(?:\\d+ ){3}(?:\\*|\\d[\\d,]*)(?: \\*){2}$',
    month: '^(?:\\d+ ){4}[a-zA-Z, ]+\\*$',
    week: '^(?:\\d+ ){3}(?:\\* ){2}[a-zA-Z, ]+$',
};

const Trigger = ({ value: propValue, values, onChange }) => {
    const [value, setValue] = useState(propValue);
    const [triggerUnit, setTriggerUnit] = useState('custom');
    const [triggerScalar, setTriggerScalar] = useState(1);
    const [triggerAt, setTriggerAt] = useState('');
    const [triggerDates, setTriggerDates] = useState([]);
    const [triggerCustom, setTriggerCustom] = useState('');

    // Parse time based on propValue when component mounts or value changes
    useEffect(() => {
        setValue(propValue);
        parseTime(propValue);
    }, [propValue, values]);

    const parseTime = (value) => {
        let unit = 'custom';
        let scalar = 1;
        let at = '';
        let dates = [];

        if (JSON.stringify(values || []) === '["none"]' || value === null) {
            unit = 'null';
        } else if (typeof value === 'string' && !value.match(/^([\d*][\d*\,\/-]* ){3}/)) {
            unit = 'eventStream';
        } else {
            Object.keys(triggerUnits).forEach((triggerUnitName) => {
                const regex = triggerUnits[triggerUnitName];
                if (new RegExp(regex).test(value.trim())) {
                    unit = triggerUnitName;
                }
            });

            if (value.trim() === '0 0 0 1 * *') {
                unit = 'month';
            }

            const parts = value.trim().split(/\s+/);

            switch (unit) {
                case 'minute':
                    scalar = parts[1].split('/')[1];
                    at = parts[0];
                    break;
                case 'hour':
                    scalar = parts[2].split('/')[1];
                    at = `${parts[1]}:${parts[0]}`;
                    break;
                case 'day':
                    dates = parts[3] === '*' ? [] : parts[3].split(',');
                    at = `${parts[2]}:${parts[1]}:${parts[0]}`;
                    break;
                case 'week':
                    dates = parts[5].split(',');
                    at = `${parts[2]}:${parts[1]}:${parts[0]}`;
                    break;
                case 'month':
                    dates = parts[4] === '*' ? [] : parts[4].split(',');
                    at = `${parts[2]}:${parts[1]}:${parts[0]}`;
                    break;
                default:
                    break;
            }
        }

        setTriggerUnit(unit);
        setTriggerScalar(scalar);
        setTriggerAt(at);
        setTriggerDates(dates);

        if (['eventStream', 'null'].indexOf(unit) === -1) {
            generateTime(false);
        }
    };

    const generateTime = (setDirty) => {
        let unit = triggerUnit;
        let scalar = triggerScalar || 1;
        let at = triggerAt || '';
        let dates = triggerDates || [];
        let time = '';

        at = at.split(/[^\d]/).map((val) => parseInt(val) || 0);

        switch (unit) {
            case 'minute':
                time = `${at[0] % 60} */${scalar} * * * *`;
                break;
            case 'hour':
                time = `${at[1] % 60} ${at[0] % 60} */${scalar} * * *`;
                break;
            case 'day':
                time = `${at[2] % 60} ${at[1] % 60} ${at[0] % 24} ${dates.length === 0 ? '*' : dates.join(',')} * *`;
                break;
            case 'week':
                time = `${at[2] % 60} ${at[1] % 60} ${at[0] % 24} * * ${dates.length === 0 ? 'Sun' : dates.join(',')}`;
                break;
            case 'month':
                time = `${at[3] % 60} ${at[2] % 60} ${at[1] % 24} ${Math.max(Math.min(at[0], 31), 1)} ${dates.length === 0 ? '*' : dates.join(',')} *`;
                break;
            case 'eventStream':
                time = [''];
                break;
            case 'custom':
                time = `${at[0] % 60} 0 * * * *`;
                break;
            case 'null':
                time = null;
                break;
            default:
                break;
        }

        if (unit !== 'eventStream') {
            setValue(time);
            if (setDirty) {
                handleDirty();
            }
        }
    };

    const handleDirty = () => {
        if (onChange) {
            onChange(triggerUnit === 'eventStream' ? [value] : value);
        }
    };

    const setEventStream = (stream) => {
        if (stream) {
            setValue([stream.label]);
            handleDirty();
        }
    };

    return (
        <div className="triggerComponent">
            <select name="triggerUnit" value={triggerUnit || ''} onChange={(e) => setTriggerUnit(e.currentTarget.value)} style={{ marginBottom: 5 }}>
                {typeof values !== 'object' || values.indexOf('stream') !== -1 ? <option value="eventStream">Event Stream</option> : null}
                {typeof values !== 'object' || values.indexOf('time') !== -1 ? (
                    <>
                        <option value="minute">Run Minutely</option>
                        <option value="hour">Run Hourly</option>
                        <option value="day">Run Daily</option>
                        <option value="week">Run Weekly</option>
                        <option value="month">Run Monthly</option>
                        <option value="custom">Run Custom</option>
                    </>
                ) : null}
                {typeof values !== 'object' || values.indexOf('none') !== -1 ? <option value="null">Not Scheduled</option> : null}
            </select>

            {triggerUnit === 'minute' || triggerUnit === 'hour' ? (
                <div className="theme-form-row no-wrap">
                    <span className="no-wrap text-middle padding-4">Run every</span>
                    <input type="number" min="1" value={triggerScalar || 1} onChange={(e) => setTriggerScalar(e.currentTarget.value)} style={{ marginBottom: 5 }} />
                    <span className="no-wrap text-middle">{`${triggerUnit}${triggerScalar > 1 ? 's' : ''}, at`}</span>
                    <input type="text" value={triggerAt} placeholder={triggerUnit === 'hour' ? 'minutes:seconds' : 'seconds'} onChange={(e) => setTriggerAt(e.currentTarget.value)} style={{ width: '5em', marginBottom: 5 }} />
                    <span className="no-wrap text-middle">{triggerUnit === 'minute' ? 'seconds past the minute' : 'minutes and seconds past the hour'}</span>
                </div>
            ) : null}

            {/* Similar handling for other units (day, week, month, etc.) */}

            {triggerUnit && triggerUnit !== 'null' ? (
                <div>
                    {triggerUnit === 'eventStream' ? (
                        <NodeSearch key="0" name="triggers" value={Array.isArray(value) ? value[0] : value} className="display-inline-block" nodeType={'queues|systems'} onChange={setEventStream} />
                    ) : (
                        <input key="1" id="time" name="time" type="text" value={value || ''} className="triggerTime" placeholder="* * * * * *" onChange={(e) => setTriggerCustom(e.currentTarget.value)} />
                    )}
                </div>
            ) : null}
        </div>
    );
};

export default Trigger;
