import React from "react";

const ToggleSwitch = ({ id, onChange, checked }) => {
  const uniqueId = id || `toggleSwitch_${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="toggle-switch">
      <input
        type="checkbox"
        className="toggle-switch-checkbox"
        name={uniqueId}
        id={uniqueId}
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        aria-checked={checked}
      />
      <label className="toggle-switch-label" htmlFor={uniqueId}>
        <span className="toggle-switch-inner" />
        <span className="toggle-switch-switch" />
      </label>
    </div>
  );
}

export default ToggleSwitch;
