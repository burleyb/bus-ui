import React, { useEffect } from 'react';
import sortable from 'html5sortable';

const SavedWorkflows = ({ workflows, onClose }) => {
  useEffect(() => {
    const modal = LeoKit.modal($('#savedWorkflows'), {}, 'Saved Workflows', onClose);

    sortable('#savedWorkflows', {
      handle: '.icon-menu',
      forcePlaceholderSize: true
    });

    sortable('#savedWorkflows')[0].addEventListener('sortupdate', (event) => {
      const order = Array.from(event.detail.newStartList).map((element) => {
        return $(element).data('view');
      });
      workflows.order(order);
    });

    return () => {
      sortable('#savedWorkflows', 'destroy');
      LeoKit.closeModal(modal); // Clean up modal on unmount
    };
  }, [workflows, onClose]);

  const handleDelete = (view) => {
    workflows.delete(view);
    setTimeout(() => {
      LeoKit.center($('#savedWorkflows')); // Adjust modal position after deletion
    }, 1000);
  };

  const savedWorkflows = workflows.views;
  const order = workflows.order();

  return (
    <div>
      <div id="savedWorkflows" className="saved-views">
        {order.length ? (
          order.map((view) => (
            <div key={view} className="workflow-div flex-row flex-space" data-view={view}>
              <i className="icon-menu" />
              <span className="flex-grow" onClick={() => workflows.restore(view)}>
                {view}
              </span>
              <i className="icon-minus-circled pull-right" onClick={() => handleDelete(view)}></i>
            </div>
          ))
        ) : (
          'There are no saved Workflows'
        )}
      </div>
    </div>
  );
};

export default SavedWorkflows;
