import React, { useState } from 'react';

const DropDown = () => {
    const [sdkPick, setSdkPick] = useState('');

    const handleChange = (e) => {
        setSdkPick(e.target.value);
    };

    return (
        <div>
            Pick a Language...
            <br />
            <select
                name="picking"
                id="picking"
                onChange={handleChange}
                value={sdkPick}
            >
                <option value="node">NodeJs</option>
                <option value="php">PHP</option>
            </select>
            <p>Selected Language: {sdkPick}</p>
        </div>
    );
};

export default DropDown;
