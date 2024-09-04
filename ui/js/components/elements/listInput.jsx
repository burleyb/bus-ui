import React, { useState } from 'react';

const List = ({ value = '', title, placeholder, name, onChange }) => {
    const [values, setValues] = useState(value.split(','));
    const [addItem, setAddItem] = useState('');

    const handleAddItem = (event) => {
        if (event.currentTarget.value) {
            const inputBox = event.currentTarget;
            const newValues = [...values, event.currentTarget.value];
            setValues(newValues);
            setAddItem('');
            inputBox.focus();
        }
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            event.currentTarget.blur();
        }
    };

    const handleRemoveItem = (item) => {
        const newValues = values.filter((value) => value !== item);
        setValues(newValues);
    };

    return (
        <div className="flex-column list-input">
            <div className="theme-form-input" title={title}>
                {values.map((value) => (
                    <div key={value} className="flex-row space-between">
                        <span>{value}</span>
                        <i
                            className="icon-cancel theme-color-disabled"
                            onClick={() => handleRemoveItem(value)}
                        />
                    </div>
                ))}
            </div>
            <input
                value={addItem}
                placeholder={placeholder}
                onChange={(event) => setAddItem(event.currentTarget.value)}
                onBlur={handleAddItem}
                onKeyPress={handleKeyPress}
            />
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
