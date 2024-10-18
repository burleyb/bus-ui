import React, { Component } from 'react';
import moment from 'moment';
import Slider from './slider.jsx'; // Assuming this is the same Slider component from before

export default class TimeSlider extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            left: 4,
            right: 5
        };
    }

    onChange(values, dropped) {
        this.setState({ left: values.left, right: values.right });

        if (dropped) {
            const { range } = this.props.timePeriod;

            this.props.onChange && this.props.onChange({
                count: (values.right - values.left) * range.step,
                offset: (5 - values.right) * range.step * 3
            });
        }
    }

    formatTime(baseTime, step, count, unit) {
        return moment(baseTime).subtract(step * count, unit).format(this.getFormat(unit));
    }

    getFormat(unit) {
        return { m: 'M/D HH:mm', h: 'M/D HH:mm', d: 'M/D HH:mm' }[unit];
    }

    render() {
        const { range, end } = this.props.timePeriod;
        const { left, right } = this.state;

        const count = (range.step * 3) * (right - left);
        const format = this.getFormat(range.unit);

        const base = moment(end).startOf(range.unit === 'm' ? 'minute' : range.unit === 'h' ? 'hour' : 'day');
        const offset = moment(base).subtract((5 - left) * range.step * 3, range.unit);

        const minText = moment(base).subtract(range.step * 15, range.unit).format(format);
        const maxText = base.format(format);

        const leftTitle = offset.format(format);
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
                onChange={this.onChange.bind(this)}
            />
        );
    }
}
