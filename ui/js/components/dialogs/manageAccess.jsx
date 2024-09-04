import React, { useState, useEffect } from 'react';

const ManageAccess = ({ onClose }) => {
  const [ips, setIps] = useState(['127.0.0.1']);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const modal = LeoKit.modal($('.manageAccess'), {}, 'Manage Access', onClose);

    return () => {
      LeoKit.closeModal(modal); // Clean up modal on unmount
    };
  }, [onClose]);

  const add = () => {
    setAdding(true);
    setTimeout(() => {
      $('[name="add"]').focus();
    }, 0);
  };

  const save = (event) => {
    const value = event.currentTarget.value;
    if (value) {
      setIps((prevIps) => [...prevIps, value]);
    }
    setAdding(false);
  };

  const deleteIp = (ip) => {
    setIps((prevIps) => prevIps.filter((currentIp) => currentIp !== ip));
  };

  const onKeyDown = (event) => {
    if (event.keyCode === 13) {
      event.currentTarget.blur();
    }
  };

  return (
    <div className="display-none">
      <div className="manageAccess">
        <div className="saved-views">
          {ips.map((ip) => (
            <div key={ip} className="workflow-div flex-row flex-space">
              <span className="flex-grow">{ip}</span>
              <i className="icon-minus-circled pull-right" onClick={() => deleteIp(ip)} />
            </div>
          ))}
          <div className="workflow-div flex-row flex-space text-left">
            {adding ? (
              <input
                type="text"
                name="add"
                className="flex-grow theme-form-input"
                placeholder="IP address"
                onBlur={save}
                onKeyDown={onKeyDown}
              />
            ) : (
              <span className="flex-grow" onClick={add}>
                <i className="icon-plus" /> add
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageAccess;
