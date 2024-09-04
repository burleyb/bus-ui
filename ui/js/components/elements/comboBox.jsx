import React, { useState } from 'react';

const ComboBox = ({ label, placeholder, icon, name }) => {
  const [text, setText] = useState('');
  const [active, setActive] = useState(false);

  const handleFocus = () => {
    setActive(true);
    console.log('focus');
  };

  const handleBlur = () => {
    setTimeout(() => {
      setActive(false);
      console.log('blur');
    }, 100);
  };

  const handleChange = (event) => {
    setText(event.currentTarget.value);
  };

  const handleSelect = () => {
    // You can add logic here for handling the selection if necessary
  };

  return (
    <div className="theme-form-row theme-required">
      <label>{label}</label>
      <input
        placeholder={placeholder || ''}
        className={`theme-combo-box${active ? ' active' : ''}`}
        value={text || ''}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
      />
      <ul>
        <li onClick={handleSelect}>
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
        <li onClick={handleSelect}>
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
