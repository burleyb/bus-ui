import React, { useState, useEffect } from 'react';
import Datetime from 'react-datetime';
// import "react-datetime/css/react-datetime.css";
import moment from 'moment';

const TimePicker = ({ timeFrames = ['15m', '1hr', '6hr', '1d', '1w'], customTimeFrame, onClick, active, datePicker, now, onRefresh }) => {
    const [currentCustomTime, setCurrentCustomTime] = useState(customTimeFrame || moment());

    useEffect(() => {
        if (customTimeFrame) {
            setCurrentCustomTime(moment(customTimeFrame));
        }
    }, [customTimeFrame]);

    const handleTimeClick = (timePeriod) => {
        const formattedPeriod = timePeriod.replace('hr', 'h');
        onClick && onClick(formattedPeriod);
    };

    const handleCustomTimeChange = (date) => {
        setCurrentCustomTime(date);
        datePicker && datePicker(date);
    };

    const handleNowClick = () => {
        setCurrentCustomTime(moment());
        datePicker && datePicker(moment());
    };

    return (
        <div className={`theme-time-picker ${datePicker ? 'has-date-picker' : ''}`}>
            <div className="wrapper">
                {timeFrames.map((timePeriod) => (
                    <span
                        key={timePeriod}
                        className={`time ${active === timePeriod.replace('h', 'hr') ? 'active' : ''}`}
                        onClick={() => handleTimeClick(timePeriod)}
                    >
                        {timePeriod}
                    </span>
                ))}
            </div>

            {datePicker && (
                <span className="input-group time position-relative">
                    <Datetime
                        value={currentCustomTime}
                        onChange={handleCustomTimeChange}
                        closeOnSelect={true}
                        timeFormat="HH:mm"
                        dateFormat="YYYY-MM-DD"
                        input={false}
                    />
                    <i className={`icon-calendar-empty datepickerbutton ${active ? '' : 'active'}`} />
                </span>
            )}

            {now && <div onClick={handleNowClick}>Now</div>}

            {onRefresh && <i className="icon-refresh" onClick={onRefresh} />}
        </div>
    );
};

export default TimePicker;
