import React, { useState } from 'react';

const ComboBox = ({ label, placeholder, icon, name }) => {
    const [text, setText] = useState('');
    const [active, setActive] = useState(false);

    const onFocus = () => {
        setActive(true);
        console.log('focus');
    };

    const onBlur = () => {
        setTimeout(() => {
            setActive(false);
            console.log('blur');
        }, 100);
    };

    const onChange = (event) => {
        setText(event.currentTarget.value);
    };

    const onSelect = () => {
        // Selection logic can go here
        console.log('selected');
    };

    return (
        <div className="theme-form-row theme-required">
            <label>{label}</label>
            <input
                placeholder={placeholder || ''}
                className={`theme-combo-box${active ? ' active' : ''}`}
                value={text || ''}
                onClick={onFocus}
                onBlur={onBlur}
                onChange={onChange}
            />
            <ul>
                <li onClick={onSelect}>
                    <label>Add New</label>
                    <div>
                        <img src={icon} alt="icon" />
                        {text ? (
                            <span>
                                {text}
                                <img className="pull-right" src={`${window.leostaticcdn}images/icons/enter.png`} alt="enter" />
                            </span>
                        ) : (
                            <span>Type to name a new {name}...</span>
                        )}
                    </div>
                </li>
                <li onClick={onSelect}>
                    <label>Select Existing</label>
                    <div>
                        <img src={icon} alt="icon" /> No matches
                    </div>
                </li>
            </ul>
        </div>
    );
};

export default ComboBox;
