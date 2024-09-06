import React, { useContext } from 'react';
import { DataContext } from '../../../stores/DataContext'; // Assuming usage of React Context for state management

const DropDown = () => {
    const { state, dispatch } = useContext(DataContext); // Using React Context to manage global state

    const handleChange = (e) => {
        dispatch({ type: 'SET_SDK_PICK', payload: e.target.value });
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
