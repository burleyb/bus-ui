import React, { useState, useEffect } from 'react';
import Slider from '../elements/slider.jsx';
import moment from 'moment';

const TimeSlider = ({ onChange }) => {
    const [left, setLeft] = useState(4);
    const [right, setRight] = useState(5);
    const [timePeriod, setTimePeriod] = useState(window.timePeriod.range); // Assuming timePeriod comes from a context or prop

    useEffect(() => {
        // Sync with window.timePeriod if needed (as per your original logic)
        setTimePeriod(window.timePeriod.range);
    }, []);

    const handleChange = (values, dropped) => {
        setLeft(values.left);
        setRight(values.right);

        if (dropped && onChange) {
            onChange({
                count: (values.right - values.left) * timePeriod.step,
                offset: (5 - values.right) * timePeriod.step * 3,
            });
        }
    };

    const range = timePeriod;
    const count = (range.step * 3) * (right - left);
    const format = { m: 'M/D HH:mm', h: 'M/D HH:mm', d: 'M/D HH:mm' }[range.unit];
    const base = moment(window.timePeriod.end);
    const offset = moment(window.timePeriod.end).subtract((5 - left) * range.step * 3, range.unit);

    if (range.unit === 'm') {
        base.startOf('minute');
        offset.startOf('minute');
    } else if (range.unit === 'h' && (right - left) === 1) {
        base.subtract(base.minute() % 15, 'm');
        offset.subtract(offset.minute() % 15, 'm');
    } else if (range.unit === 'h' || range.unit === 'd') {
        base.startOf('hour');
        offset.startOf('hour');
    }

    const minText = moment(base).subtract((range.step * 15), range.unit).format(format);
    const maxText = moment(base).format(format);
    const leftTitle = moment(offset).format(format);
    const rightTitle = moment(offset).add(((right - left) * range.step * 3), range.unit).format(format);

    return (
        <Slider
            min={0}
            max={5}
            step={1}
            left={left}
            right={right}
            minText={minText}
            maxText={maxText}
            leftTitle={leftTitle}
            selectionText={`${count} ${range.unit}`}
            rightTitle={rightTitle}
            onChange={handleChange}
        />
    );
};

export default TimeSlider;
