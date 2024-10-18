import React, { useContext } from 'react';
import { useData } from '../../stores/DataContext.jsx'; // Assuming DataContext for global state

const DropDown = () => {
    const state = useData();

    const handleChange = (e) => {
        state?.setSdkPick(e.target.value);
    };

    return (
        <div>
            Pick a Language...
            <br />
            <select name="picking" id="picking" onChange={handleChange}>
                <option value="node">NodeJs</option>
                <option value="php">PHP</option>
            </select>
        </div>
    );
};

export default DropDown;
