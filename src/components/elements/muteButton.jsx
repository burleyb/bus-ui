import React, { useState, useContext } from 'react';
import { useData } from '../../stores/DataContext.jsx'; // Assuming DataContext for global state
import axios from 'axios';
import moment from 'moment';

const MuteButton = ({ id, mute }) => {
    const state = useData(); 
    const [showMuteAlarmId, setShowMuteAlarmId] = useState(false);
    const [paused, setPaused] = useState(mute);

    const timePeriod = {
        '15m': { minutes: 15 },
        '30m': { minutes: 30 },
        '1hr': { hours: 1 },
        '2hr': { hours: 2 },
        '6hr': { hours: 6 },
        '1d': { days: 1 },
        '1w': { days: 7 }
    };

    const toggleMuteAlarm = (showMuteAlarmId, event) => {
        event.stopPropagation();
        setShowMuteAlarmId(showMuteAlarmId);
    };

    const setMute = async (id, event) => {
        let muteText = event.currentTarget.textContent.trim();
        let muteValue;

        switch (muteText) {
            case '∞': {
                muteValue = true;
                break;
            }
            case 'unmute': {
                muteValue = false;
                break;
            }
            default: {
                const timeMuted = timePeriod[muteText];
                muteValue = timeMuted ? Math.floor(moment().add(timeMuted).valueOf()) : false;
            }
        }

        const data = { id, health: { mute: muteValue } };
        const currentMute = state.nodes?.[id]?.health?.mute ?? false;

        try {
            // Update local state first
            if (state.nodes?.[id]?.health) {
                state.nodes[id].health.mute = muteValue !== undefined ? muteValue : currentMute;
            }
            setPaused(muteValue);

            // Perform the server request
            await axios.post(`${state.api}api/cron/saveOverrides`, data);

            const message = `${id} ${!muteValue ? 'un-muted' : `muted ${muteValue !== true ? `until ${moment(muteValue).calendar()}` : 'indefinitely'}`}`;
            state.messageLogNotify(message, 'info');
            
            // Trigger a data refresh after mute change
            state.fetchStats();
        } catch (error) {
            // Revert the local state on failure
            if (state.nodes?.[id]?.health) {
                state.nodes[id].health.mute = currentMute;
            }
            state.messageLogNotify(`Failed to ${!muteValue ? 'un-mute' : 'mute'} ${id}`, 'error', error);
        }
    };

    return (
        <a className="position-relative">
            <i 
                className={`${!mute ? 'icon-volume-low' : 'icon-volume-off'} font-15em ${!mute ? 'unMuted' : 'muted'}`}
                onClick={(event) => toggleMuteAlarm(id, event)}
            />
            {showMuteAlarmId === id && (
                <div className="mute-alarm theme-popup-below-left">
                    <div className="mask" onClick={(event) => toggleMuteAlarm(false, event)}></div>

                    {mute && (
                        <header>
                            <i className="icon-volume-off theme-color-success" />
                            {mute === true ? <span>Muted Indefinitely</span> : <span>Muted until {moment(mute).calendar()}</span>}
                        </header>
                    )}

                    <header>
                        {mute ? (
                            <>
                                Edit mute:
                                <button type="button" className="theme-button-micro pull-right" onClick={(event) => setMute(id, event)}>unmute</button>
                            </>
                        ) : (
                            'Mute alarm for:'
                        )}
                    </header>

                    <div className="times">
                        {['15m', '30m', '1hr', '2hr', '6hr', '1d', '1w', '∞'].map((duration) => (
                            <span
                                key={duration}
                                className="theme-hover-glow"
                                dangerouslySetInnerHTML={{ __html: duration }}
                                onClick={(event) => setMute(id, event)}
                            ></span>
                        ))}
                    </div>
                </div>
            )}
        </a>
    );
};

export default MuteButton;
