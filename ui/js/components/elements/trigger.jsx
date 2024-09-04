import React, { useState, useEffect } from 'react';
import NodeSearch from '../elements/nodeSearch.jsx';

const triggerUnits = {
    minute: '^\\d+ \\*\\/\\d+(?: \\*){4}$',
    hour: '^(?:\\d+ ){2}\\*\\/\\d+(?: \\*){3}$',
    day: '^(?:\\d+ ){3}(?:\\*|\\d[\\d,]*)(?: \\*){2}$',
    month: '^(?:\\d+ ){4}[a-zA-Z, ]+\\*$',
    week: '^(?:\\d+ ){3}(?:\\* ){2}[a-zA-Z, ]+$',
};

const Trigger = (props) => {
    const [value, setValue] = useState(props.value);
    const [triggerUnit, setTriggerUnit] = useState('custom');
    const [triggerScalar, setTriggerScalar] = useState(1);
    const [triggerAt, setTriggerAt] = useState('');
    const [triggerDates, setTriggerDates] = useState([]);
    const [triggerCustom, setTriggerCustom] = useState('');

    useEffect(() => {
        parseTime();
    }, [value]);

    useEffect(() => {
        if (props.value !== value) {
            setValue(props.value);
        }
    }, [props.value]);

    const parseTime = () => {
        let unit = 'custom',
            scalar = 1,
            at = '',
            dates = [];

        if (JSON.stringify(props.values || []) === '["none"]' || value == null) {
            unit = 'null';
        } else if ((typeof value === 'string' && !value.match(/^([\d*][\d*\,\/-]* ){3}/)) || (value && Array.isArray(value))) {
            unit = 'eventStream';
        } else {
            Object.keys(triggerUnits).forEach((triggerUnitName) => {
                if (new RegExp(triggerUnits[triggerUnitName]).test(value.trim())) {
                    unit = triggerUnitName;
                }
            });

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

        if (unit === 'eventStream' && typeof props.values === 'object' && props.values.indexOf('stream') === -1) {
            unit = 'null';
        }

        setTriggerUnit(unit);
        setTriggerScalar(scalar);
        setTriggerAt(at);
        setTriggerDates(dates);
        setTriggerCustom('');
    };

    const generateTime = (setDirty) => {
        let time = '';
        const parts = triggerAt.split(/[^\d]/).map((part) => parseInt(part) || 0);

        switch (triggerUnit) {
            case 'minute':
                time = `${parts[0] % 60} */${triggerScalar} * * * * `;
                break;
            case 'hour':
                time = `${parts[1] % 60} ${parts[0] % 60} */${triggerScalar} * * * `;
                break;
            case 'day':
                time = `${parts[2] % 60} ${parts[1] % 60} ${parts[0] % 24} ${triggerDates.length === 0 ? '*' : triggerDates.join(',')} * * `;
                break;
            case 'week':
                time = `${parts[2] % 60} ${parts[1] % 60} ${parts[0] % 24} * * ${triggerDates.length === 0 ? 'Sun' : triggerDates.join(',')}`;
                break;
            case 'month':
                time = `${parts[3] % 60} ${parts[2] % 60} ${parts[1] % 24} ${Math.max(Math.min(parts[0], 31), 1)} ${triggerDates.length === 0 ? '*' : triggerDates.join(',')} * `;
                break;
            case 'eventStream':
                time = [''];
                break;
            case 'custom':
                time = `${parts[0] % 60} 0 * * * * `;
                break;
            case 'null':
                time = null;
                break;
            default:
                break;
        }

        setValue(time);
        if (setDirty) props.onChange && props.onChange(triggerUnit === 'eventStream' ? [time] : time);
    };

    const handleDateToggle = (date) => {
        let updatedDates = [...triggerDates];
        if (date === 'all') {
            updatedDates = [];
        } else if (date === 'even') {
            updatedDates = Array(15).fill().map((_, i) => (i + 1) * 2);
        } else if (date === 'odd') {
            updatedDates = Array(16).fill().map((_, i) => (i * 2) + 1);
        } else {
            if (updatedDates.includes(date)) {
                updatedDates = updatedDates.filter((d) => d !== date);
            } else {
                updatedDates.push(date);
            }
        }
        setTriggerDates(updatedDates);
        generateTime(true);
    };

    return (
        <div className="triggerComponent">
            <select name="triggerUnit" value={triggerUnit || ''} onChange={(e) => setTriggerUnit(e.target.value)} style={{ marginBottom: 5 }}>
                {typeof props.values !== 'object' || props.values.includes('stream') ? <option value="eventStream">Event Stream</option> : null}
                {typeof props.values !== 'object' || props.values.includes('time')
                    ? ['minute', 'hour', 'day', 'week', 'month', 'custom'].map((unit, idx) => (
                          <option key={idx} value={unit}>
                              Run {unit.charAt(0).toUpperCase() + unit.slice(1)}
                          </option>
                      ))
                    : null}
                {typeof props.values !== 'object' || props.values.includes('none') ? <option value="null">not scheduled</option> : null}
            </select>

            {triggerUnit === 'minute' || triggerUnit === 'hour' ? (
                <div className="theme-form-row no-wrap">
                    <span className="no-wrap text-middle padding-4">Run every</span>
                    <input type="number" min="1" value={triggerScalar || 1} onChange={(e) => setTriggerScalar(e.target.value)} style={{ marginBottom: 5 }} />
                    <span className="no-wrap text-middle">{triggerUnit + (triggerScalar === 1 ? '' : 's')}, at</span>
                    <input
                        type="text"
                        value={triggerAt}
                        placeholder={triggerUnit === 'hour' ? 'minutes:seconds' : 'seconds'}
                        onChange={(e) => setTriggerAt(e.target.value)}
                        style={{ width: '5em', marginBottom: 5 }}
                    />
                    <span className="no-wrap text-middle">
                        {triggerUnit === 'minute' ? 'seconds past the minute' : 'minutes and seconds past the hour'}
                    </span>
                </div>
            ) : triggerUnit === 'day' || triggerUnit === 'week' || triggerUnit === 'month' ? (
                <div>
                    <div className="theme-form-row">
                        <label>Pick {triggerUnit === 'day' ? 'Days' : triggerUnit === 'week' ? 'Weekdays' : 'Months'}</label>
                        <div className="date-picker">
                            {(triggerUnit === 'day'
                                ? Array.from({ length: 31 }, (_, i) => i + 1)
                                : triggerUnit === 'week'
                                ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                                : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                            ).map((date, i) => (
                                <u key={i} className={triggerDates.includes(date) ? 'active' : ''} onClick={() => handleDateToggle(date)}>
                                    {typeof date === 'number' ? date : date.charAt(0)}
                                </u>
                            ))}
                            <u onClick={() => handleDateToggle('all')}>All</u>
                            <u onClick={() => handleDateToggle('even')}>Even</u>
                            <u onClick={() => handleDateToggle('odd')}>Odd</u>
                        </div>
                    </div>
                    <div className="theme-form-row">
                        <label>@</label>
                        <input type="text" value={triggerAt} placeholder={triggerUnit === 'day' ? 'hour:minutes:seconds' : 'day hour:minutes:seconds'} onChange={(e) => setTriggerAt(e.target.value)} />
                    </div>
                </div>
            ) : null}

            {triggerUnit && triggerUnit !== 'null' && triggerUnit !== 'none' && (
                <div>
                    {triggerUnit === 'eventStream' ? (
                        <NodeSearch
                            key="0"
                            name="triggers"
                            value={Array.isArray(value) ? value[0] : value || ''}
                            className="display-inline-block"
                            nodeType={'queues|systems'}
                            onChange={(stream) => setValue(stream)}
                        />
                    ) : (
                        <input key="1" id="time" name="time" type="text" value={value || ''} className="triggerTime" placeholder="* * * * * *" onChange={(e) => setTriggerCustom(e.target.value)} />
                    )}
                </div>
            )}
        </div>
    );
};

export default Trigger;
