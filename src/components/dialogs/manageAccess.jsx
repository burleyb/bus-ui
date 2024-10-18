import React, { useState } from 'react';
import Dialog from './dialog.jsx';  // Assuming this is the dialog component we created

function ManageAccess({ onClose }) {
    const [ips, setIps] = useState(['127.0.0.1']);  // Default IP list
    const [adding, setAdding] = useState(false);     // State for adding new IP
    const [newIp, setNewIp] = useState('');          // Input value for new IP

    const addIp = () => {
        setAdding(true);
        setTimeout(() => {
            const input = document.querySelector('[name="add"]');
            if (input) input.focus();  // Focus on the input field
        }, 0);
    };

    const saveIp = (event) => {
        const value = event.currentTarget.value.trim();
        if (value) {
            setIps((prevIps) => [...prevIps, value]);  // Add the new IP to the list
        }
        setNewIp('');  // Clear input after saving
        setAdding(false);  // Exit adding state
    };

    const deleteIp = (ipToDelete) => {
        setIps((prevIps) => prevIps.filter((ip) => ip !== ipToDelete));  // Remove the IP
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.currentTarget.blur();  // Trigger blur event to save IP
        }
    };

    return (
        <Dialog title="Manage Access" onClose={onClose}>
            <div className="saved-views">
                {ips.map((ip) => (
                    <div key={ip} className="workflow-div flex-row flex-space">
                        <span className="flex-grow">{ip}</span>
                        <i
                            className="icon-minus-circled pull-right"
                            onClick={() => deleteIp(ip)}
                            style={{ cursor: 'pointer' }}
                        />
                    </div>
                ))}
                <div className="workflow-div flex-row flex-space text-left">
                    {adding ? (
                        <input
                            type="text"
                            name="add"
                            className="flex-grow theme-form-input"
                            placeholder="IP address"
                            onBlur={saveIp}
                            onKeyDown={handleKeyDown}
                        />
                    ) : (
                        <span className="flex-grow" onClick={addIp} style={{ cursor: 'pointer' }}>
                            <i className="icon-plus" /> Add
                        </span>
                    )}
                </div>
            </div>
        </Dialog>
    );
}

export default ManageAccess;
