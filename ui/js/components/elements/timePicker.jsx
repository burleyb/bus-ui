import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';

const TimePicker = ({ active, timeFrames = ['15m', '1hr', '6hr', '1d', '1w'], customTimeFrame, onClick, datePicker, now, onRefresh }) => {
    const [selectedDate, setSelectedDate] = useState(customTimeFrame ? moment(customTimeFrame).toDate() : new Date());

    useEffect(() => {
        if (customTimeFrame) {
            setSelectedDate(moment(customTimeFrame).toDate());
        }
    }, [customTimeFrame]);

    const handleDateChange = (date) => {
        setSelectedDate(date);
        if (datePicker) {
            datePicker(date);
        }
    };

    const handleTimeFrameClick = (timePeriod) => {
        const formattedTimePeriod = timePeriod.replace('hr', 'h');
        if (onClick) {
            onClick(formattedTimePeriod);
        }
    };

    return (
        <div className={'theme-time-picker' + (datePicker ? ' has-date-picker' : '')}>
            <div className="wrapper">
                {timeFrames.map((timePeriod) => (
                    <span
                        key={timePeriod}
                        className={'time' + (active === timePeriod.replace('h', 'hr') ? ' active' : '')}
                        onClick={() => handleTimeFrameClick(timePeriod)}
                    >
                        {timePeriod}
                    </span>
                ))}
            </div>

            {datePicker && (
                <div className="input-group time position-relative">
                    <DatePicker
                        selected={selectedDate}
                        onChange={handleDateChange}
                        maxDate={new Date()}
                        showTimeSelect
                        dateFormat="MMMM d, yyyy h:mm aa"
                    />
                </div>
            )}

            {now && <div>Now</div>}

            {onRefresh && <i className="icon-refresh" onClick={onRefresh} />}
        </div>
    );
};

export default TimePicker;
