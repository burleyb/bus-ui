import React, { useState } from 'react';
import moment from 'moment';

const MuteButton = ({ id, mute, onChange }) => {
    const [showMuteAlarmId, setShowMuteAlarmId] = useState(null);
    const [paused, setPaused] = useState(mute);

    const toggleMuteAlarm = (alarmId, event) => {
        event.stopPropagation();
        setShowMuteAlarmId(alarmId);
    };

    const setMute = (id, event) => {
        const timePeriod = {
            '15m': { minutes: 15 },
            '30m': { minutes: 30 },
            '1hr': { hours: 1 },
            '2hr': { hours: 2 },
            '6hr': { hours: 6 },
            '1d': { days: 1 },
            '1w': { days: 7 },
        };

        let mute = event.currentTarget.textContent;
        if (mute === '&#x221e;' || mute === '∞') {
            mute = true;
        } else if (mute === 'unmute') {
            mute = false;
        } else {
            const timeMuted = timePeriod[mute];
            mute = Math.floor(moment().add(timeMuted).valueOf());
        }

        const data = {
            id: id,
            health: { mute: mute }
        };

        // Send mute/unmute request
        $.post('api/cron/saveOverrides', JSON.stringify(data), (response) => {
            window.messageLogNotify(
                id + (!mute ? ' un-muted' : (' muted' + (mute !== true ? ' until ' + moment(mute).calendar() : ' indefinitely'))),
                'info'
            );
            setPaused(mute);
        }).fail((result) => {
            window.messageLogNotify('Failed to ' + (!mute ? 'un-mute ' : 'mute ') + (id || ''), 'error', result);
        });
    };

    return (
        <a className="position-relative">
            <i
                className={`${!mute ? 'icon-volume-low' : 'icon-volume-off'} font-15em ${!mute ? 'unMuted' : 'muted'}`}
                onClick={(e) => toggleMuteAlarm(id, e)}
            />
            {showMuteAlarmId === id && (
                <div className="mute-alarm theme-popup-below-left">
                    <div className="mask" onClick={(e) => toggleMuteAlarm(null, e)}></div>
                    {mute && (
                        <header>
                            <i className="icon-volume-off theme-color-success" />
                            {mute === true ? (
                                <span>Muted Indefinitely</span>
                            ) : (
                                <span>Muted until {moment(mute).calendar()}</span>
                            )}
                        </header>
                    )}
                    <header>
                        {mute ? (
                            <>
                                Edit mute:
                                <button type="button" className="theme-button-micro pull-right" onClick={(e) => setMute(id, e)}>
                                    unmute
                                </button>
                            </>
                        ) : (
                            'Mute alarm for:'
                        )}
                    </header>
                    <div className="times">
                        {['15m', '30m', '1hr', '2hr', '6hr', '1d', '1w', '&#x221e;'].map((duration) => (
                            <span
                                key={duration}
                                className="theme-hover-glow"
                                dangerouslySetInnerHTML={{ __html: duration }}
                                onClick={(e) => setMute(id, e)}
                            ></span>
                        ))}
                    </div>
                </div>
            )}
        </a>
    );
};

export default MuteButton;
