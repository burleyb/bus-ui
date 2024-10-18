import React, { useState, useEffect, useContext, useRef } from 'react';
import { useData } from '../../stores/DataContext.jsx'; // Assuming DataContext for global state
import moment from 'moment';
import * as d3 from 'd3';
import c3 from 'c3';
// import 'c3/c3.css'; // Assuming you have C3.js for charting

const TIME_FORMAT = "YYYY-MM-DD HH:mm";

const NodeChart = ({ chartKey, interval, data, compare, lastRead, showHeader, className, nodeType, isLast }) => {
    const chartSettings = useData(); 
    const chartRef = useRef(null);
    const [chartId] = useState('chart_' + chartKey.replace(/ /g, '-') + '_' + Math.floor(Math.random() * Math.pow(10, 10)) + Date.now());
    const [chart, setChart] = useState(null);

    const xAxisFormats = {
        "minute_1": (value) => moment(moment(value).valueOf()).format("HH:mm"),
        "minute_5": (value) => moment(moment(value).valueOf()).format("HH:mm"),
        "minute_15": (value) => moment(moment(value).valueOf()).format("HH:mm"),
        "hour": (value) => moment(moment(value).valueOf()).format("HH:mm"),
        "hour_6": (value) => moment(moment(value).valueOf()).format("HH:mm"),
        "day": (value) => moment(value).format("YYYY-MM-DD HH:mm"),
        "week": (value) => moment(value).format("YYYY-MM-DD"),
    };

    const selectedTime = {
        minute_15: { step: 1, unit: 'm', interval: 'minute_1' },
        hour: { step: 15, unit: 'm', interval: 'minute_15' },
        hour_6: { step: 15, unit: 'm', interval: 'minute_15' },
        day: { step: 1, unit: 'h', interval: 'hour' },
        week: { step: 1, unit: 'd', interval: 'day' },
    };

    // Chart Initialization
    const addChart = () => {
        const chartFormatter = xAxisFormats[interval];
        const chartSetting = chartSettings[chartKey];
        const showAxis = !!showHeader && (window.innerWidth > 700);

        const newChart = c3.generate({
            bindto: `#${chartId}`,
            data: {
                x: 'x',
                xFormat: '%Y-%m-%d %H:%M',
                columns: [],
                type: 'line',
            },
            transition: { duration: 500 },
            axis: {
                x: {
                    show: showAxis,
                    type: 'timeseries',
                    tick: {
                        format: (x) => chartFormatter(x),
                        culling: { max: Math.max(Math.floor(window.innerWidth / (4 * 90)), 2) },
                        outer: false,
                    },
                },
                y: {
                    show: showAxis,
                    tick: {
                        format: chartSetting?.format || d3.format(",.2"),
                        culling: { max: Math.max(Math.floor(window.innerWidth / (4 * 90)), 2) },
                        outer: false,
                    },
                },
            },
            tooltip: {
                position: function (dataToShow, tWidth, tHeight, element) {
                    const mouse = this.d3.mouse(element);
                    const tooltipTop = Math.max(mouse[1] + 15, 0);
                    const tooltipLeft = Math.max(mouse[0] - tWidth / 2, 20);
                    return { top: tooltipTop, left: tooltipLeft };
                },
            },
            legend: { show: false },
            point: { show: false },
        });

        setChart(newChart);
        updateChart(newChart);
    };

    // Chart Update Logic
    const updateChart = (chartInstance) => {
        if (!chartInstance || document.hidden) return;

        const seriesData = data || [];
        const chartSetting = chartSettings[chartKey];

        if (!seriesData.length || !seriesData[0]) return;

        const columns = [["x"]];
        let seriesName = chartSetting.series;
        const context = {};
        let lineValue = '';

        if (typeof seriesName === "function") {
            seriesName = seriesName(seriesData, context);
        }

        if (typeof seriesName === 'string') {
            columns.push([seriesName || 'Count']);
        } else {
            Object.keys(seriesName).forEach((key) => {
                columns.push([seriesName[key]]);
            });
        }

        seriesData.forEach((serieData, serieIndex) => {
            serieData.forEach((datum) => {
                if (serieIndex === 0) columns[0].push(datum.time);

                const point = chartSetting.value(datum, context);
                if (point && point.length) {
                    point.forEach((p, i) => columns[i + 1].push(p));
                } else if (columns[serieIndex + 1]) {
                    columns[serieIndex + 1].push(point);
                }

                if (typeof lastRead !== 'undefined' && (!lineValue || moment(datum.time).isSameOrBefore(lastRead)) && chartKey === 'Events In Queue') {
                    lineValue = datum.time;
                }
            });
        });

        try {
            chartInstance.load({ columns });
        } catch (e) {
            console.error('Error loading chart columns', e);
        }
    };

    useEffect(() => {
        addChart();
        return () => {
            if (chart) chart.destroy();
        };
    }, [interval]);

    useEffect(() => {
        if (chart) updateChart(chart);
    }, [data]);

    return (
        <div className={`node-chart flex-column ${className || ''}`}>
            {showHeader && (
                <header className="text-left">
                    {chartSettings[chartKey]?.helpText && (
                        <div className="pull-right position-relative">
                            <i className="icon-help-circled" />
                            <div className={`theme-hover-view ${isLast ? 'theme-popup-above-left' : 'theme-popup-above-right'}`} style={{ maxWidth: '50vw' }}>
                                <header>Help</header>
                                <p>{chartSettings[chartKey].helpText[nodeType]}</p>
                                <a href={`${window.leoDocsLink}${chartSettings[chartKey].helpLink || 'workflows#section-show-charts'}`} target="_blank" rel="noopener noreferrer">
                                    Learn More
                                </a>
                            </div>
                        </div>
                    )}
                    <span>{chartSettings[chartKey]?.title}</span>
                </header>
            )}
            <div className="flex-row flex-grow clear-both">
                {showHeader && (
                    <div className="stats width-1-4">
                        <div className="current no-wrap responsive-font">{compare ? Math.round(compare.current) : '-'}</div>
                        <div className="prev_change no-wrap responsive-font">
                            <span>{compare ? Math.round(compare.prev) : '-'}</span>
                            <span> / </span>
                            <span>{compare ? compare.change || '-' : '-'}</span>
                        </div>
                    </div>
                )}
                <div className={`chart-container ${showHeader ? 'width-3-4' : 'width-1-1'}`}>
                    <figure id={chartId} ref={chartRef}></figure>
                </div>
            </div>
        </div>
    );
};

export default NodeChart;
