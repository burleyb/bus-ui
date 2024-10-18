import React, { useState, useEffect } from 'react';
import NodeSearch from '../elements/nodeSearch.jsx';
import refUtil from "../utils/reference.js";
import axios from 'axios';
import moment from 'moment';
import Dialog from './dialog.jsx'; // Assuming you have a reusable Dialog component

function ResetStream({ source, forceRun, links, nodeId, label, onClose }) {
    const [checkpoint, setCheckpoint] = useState('z' + moment.utc().format('/YYYY/MM/DD/HH/mm/ss/'));
    const [shortcut, setShortcut] = useState('');
    const [checked, setChecked] = useState(true);
    const [advanced, setAdvanced] = useState(false);
    const [selected, setSelected] = useState(refUtil.refId(source !== false ? source : Object.keys(links)[0]).id);
    const [selected2, setSelected2] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSetCheckpoint = (event) => {
        setShortcut(event.target.value);
    };

    const handleCustomChange = (event) => {
        setCheckpoint(event.target.value);
    };

    const handleUseUTC = () => {
        setChecked(!checked);
    };

    const handleSave = async (formData) => {
        let source = formData['checkpoint-shortcut'] || selected;
        if (source === 'selectOther') {
            source = selected2;
        }

        const data = {
            id: nodeId,
            checkpoint: { [source]: formData.checkpoint },
            executeNow: forceRun
        };

        setIsLoading(true);
        try {
            await axios.post(`${state.api}/api/cron/save`, data);
            alert(`Checkpoint changed on bot ${label || ''}`);
            // Handle any fetch or refresh logic
        } catch (error) {
            alert(`Failed changing checkpoint on bot ${label || ''}: ${error.message}`);
        } finally {
            setIsLoading(false);
            onClose(); // Close modal after save
        }
    };

    return (
        <Dialog title="Change Checkpoint" onClose={onClose} onSave={handleSave} isLoading={isLoading}>
            <div className="checkpointDialog">
                <div>
                    <label>Choose Stream</label>
                    <select name="checkpoint-shortcut" value={shortcut} onChange={handleSetCheckpoint}>
                        {Object.keys(links).map(key => (
                            <option key={key} value={key}>{key}</option>
                        ))}
                        <option value="selectOther">select other...</option>
                    </select>
                </div>

                {advanced && <NodeSearch onSelect={setSelected2} />}

                <div>
                    <label>Resume Checkpoint</label>
                    <input
                        className="fixed-size"
                        name="checkpoint"
                        type="text"
                        value={checkpoint}
                        onChange={handleCustomChange}
                    />
                    <span>UTC</span>
                    <input type="checkbox" checked={checked} onChange={handleUseUTC} />
                </div>

                {forceRun && <div className="forceWarning">Will be Force Run once Checkpoint is Saved</div>}
            </div>
        </Dialog>
    );
}

export default ResetStream;
