import { useState, useCallback } from 'react';
import moment from 'moment';

export default function useTimeRange(defaultRange = '1h') {
  const [range, setRange] = useState(defaultRange);
  const [customRange, setCustomRange] = useState(null);

  const getRangeStart = useCallback(() => {
    if (customRange) {
      return customRange.start;
    }
    const now = moment();
    switch (range) {
      case '15m': return now.subtract(15, 'minutes');
      case '1h': return now.subtract(1, 'hour');
      case '6h': return now.subtract(6, 'hours');
      case '1d': return now.subtract(1, 'day');
      case '7d': return now.subtract(7, 'days');
      default: return now.subtract(1, 'hour');
    }
  }, [range, customRange]);

  const getRangeEnd = useCallback(() => {
    return customRange ? customRange.end : moment();
  }, [customRange]);

  return {
    range,
    setRange,
    customRange,
    setCustomRange,
    getRangeStart,
    getRangeEnd
  };
}