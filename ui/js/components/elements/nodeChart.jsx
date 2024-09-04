import React, { useState, useEffect, useRef } from 'react';
import moment from 'moment';
import c3 from 'c3';

const TIME_FORMAT = "YYYY-MM-DD HH:mm";

const xAxisFormats = {
  minute_1: value => moment(value).format("HH:mm"),
  minute_5: value => moment(value).format("HH:mm"),
  minute_15: value => moment(value).format("HH:mm"),
  hour: value => moment(value).format("HH:mm"),
  hour_6: value => moment(value).format("HH:mm"),
  day: value => moment(value).format(TIME_FORMAT),
  week: value => moment(value).format("YYYY-MM-DD")
};

const selectedTime = {
  minute_15: { step: 1, unit: 'm', interval: 'minute_1' },
  hour: { step: 15, unit: 'm', interval: 'minute_15' },
  hour_6: { step: 15, unit: 'm', interval: 'minute_15' },
  day: { step: 1, unit: 'h', interval: 'hour' },
  week: { step: 1, unit: 'd', interval: 'day' }
};

const NodeChart = ({ chartKey, interval, data, chartSettings, showHeader = false, className = '', lastRead, compare = [] }) => {
  const idSuffix = useRef('_' + Math.floor(Math.random() * Math.pow(10, 10)) + Date.now()).current;
  const chartId = `chart_${chartKey.replace(/ /g, '-')}${idSuffix}`;
  const [chart, setChart] = useState(null);

  const updateChart = () => {
    if (!data || !data.length || !data[0]) return;

    const chartFormatter = xAxisFormats[interval];
    const currentTime = moment();
    const timeConfig = selectedTime[interval];
    const { step, unit } = timeConfig;

    let columns = [["x"]];
    let seriesName = chartSettings[chartKey].series;
    let context = {};

    if (typeof seriesName === "function") {
      seriesName = seriesName(data, context);
    }

    if (typeof seriesName === "string") {
      columns.push([seriesName || 'Count']);
    } else {
      for (let key in seriesName) {
        columns.push([seriesName[key]]);
      }
    }

    data.forEach((serieData, serieIndex) => {
      serieData.forEach((datum) => {
        if (serieIndex === 0) {
          columns[0].push(moment(datum.time).format(TIME_FORMAT));
        }
        const point = chartSettings[chartKey].value(datum, context);
        if (point && point.length) {
          point.forEach((p, i) => {
            columns[i + 1].push(p);
          });
        }
      });
    });

    try {
      chart.load({ columns });
    } catch (e) {
      console.error('Error updating chart: ', e);
    }
  };

  const createChart = () => {
    const chartFormatter = xAxisFormats[interval];
    const showAxis = showHeader && window.innerWidth > 700;

    const c3Chart = c3.generate({
      bindto: `#${chartId}`,
      data: {
        x: 'x',
        xFormat: '%Y-%m-%d %H:%M',
        columns: [],
        type: 'line',
      },
      axis: {
        x: {
          show: showAxis,
          type: 'timeseries',
          tick: {
            format: x => chartFormatter(x),
          }
        },
        y: {
          show: showAxis,
        }
      },
      point: {
        show: false
      }
    });

    setChart(c3Chart);
    updateChart();
  };

  useEffect(() => {
    createChart();
    return () => {
      if (chart) chart.destroy();
    };
  }, [interval, data]);

  return (
    <div className={`node-chart flex-column ${className}`}>
      {showHeader && (
        <header className="text-left">
          <span>{chartSettings[chartKey].title}</span>
        </header>
      )}
      <div className="flex-row flex-grow">
        {showHeader && (
          <div className="stats width-1-4">
            <div className="current no-wrap responsive-font">
              {compare[0] ? Math.round(compare[0].current) : '-'}
            </div>
            <div className="prev_change no-wrap responsive-font">
              <span>{compare[0] ? Math.round(compare[0].prev) : '-'}</span>
              <span> / </span>
              <span>{compare[0] ? compare[0].change || '-' : '-'}</span>
            </div>
          </div>
        )}
        <div className={`${showHeader ? 'width-3-4' : 'width-1-1'} pull-center`}>
          <figure id={chartId}></figure>
        </div>
      </div>
    </div>
  );
};

export default NodeChart;
