const formatTime = (milliseconds, showMilliseconds) => {
    if (showMilliseconds && milliseconds < 1000) {
        return Math.round(milliseconds) + 'ms';
    }
    let seconds = Math.round(milliseconds / 1000);
    if (seconds < 60) {
        return seconds + 's';
    } else {
        let minutes = Math.floor(milliseconds / (1000 * 60));
        if (minutes < 60) {
            return minutes + 'm' + (seconds % 60 ? ', ' + (seconds % 60) + 's' : '');
        } else {
            let hours = Math.floor(milliseconds / (1000 * 60 * 60));
            if (hours < 24) {
                return hours + 'h' + (minutes % 60 ? ', ' + (minutes % 60) + 'm' : '');
            } else {
                let days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
                return days + 'd' + (hours % 24 ? ', ' + (hours % 24) + 'h' : '');
            }
        }
    }
};

export default formatTime;
