import React, { useState, useRef } from 'react';

const List = ({ value, title, placeholder, name, onChange }) => {
    const [values, setValues] = useState((value || '').split(','));
    const [addItem, setAddItem] = useState('');
    const inputRef = useRef(null);

    const addItemToList = (event) => {
        if (event.currentTarget.value) {
            const newValues = [...values, event.currentTarget.value];
            setValues(newValues);
            setAddItem('');
            if (inputRef.current) {
                inputRef.current.focus(); // Focus the input element without jQuery
            }
        }
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            event.currentTarget.blur();
        }
    };

    const removeItem = (item) => {
        const newValues = values.filter((value) => value !== item);
        setValues(newValues);
    };

    return (
        <div className="flex-column list-input">
            <div className="theme-form-input" title={title}>
                {values.map((value) => (
                    <div key={value} value={value} className="flex-row space-between">
                        <span>{value}</span>
                        <i
                            className="icon-cancel theme-color-disabled"
                            onClick={() => removeItem(value)}
                        />
                    </div>
                ))}
            </div>
            <input
                ref={inputRef}
                value={addItem}
                placeholder={placeholder}
                onChange={(event) => setAddItem(event.currentTarget.value)}
                onBlur={addItemToList}
                onKeyPress={handleKeyPress}
            />

            {/* Hidden multiple select to store the values */}
            <select multiple={true} name={name} value={values} onChange={onChange} style={{ display: 'none' }}>
                {values.map((value) => (
                    <option key={value} value={value}>
                        {value}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default List;
