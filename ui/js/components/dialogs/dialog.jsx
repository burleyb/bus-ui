import React, { useEffect } from 'react';

const Content = ({ buttons = { close: false }, title, onClose, children }) => {
  useEffect(() => {
    // Equivalent to componentDidMount
    LeoKit.modal($('#dialogTag'), buttons, title, onClose);

    // Clean up when the component is unmounted
    return () => {
      LeoKit.closeModal(); // Assuming this closes the modal on unmount.
    };
  }, [buttons, title, onClose]);

  return (
    <div>
      <div id="dialogTag">
        {children}
      </div>
    </div>
  );
};

export default Content;
