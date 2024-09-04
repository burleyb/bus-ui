import React, { useEffect } from 'react';
import sortable from 'html5sortable';

const SavedSearches = ({ searches, onClose }) => {
  useEffect(() => {
    const modal = LeoKit.modal($('#savedSearches'), {}, 'Saved Searches', onClose);

    sortable('#savedSearches', {
      handle: '.icon-menu',
      forcePlaceholderSize: true
    });

    sortable('#savedSearches')[0].addEventListener('sortupdate', (event) => {
      const order = Array.from(event.detail.newStartList).map((element) => {
        return $(element).data('search');
      });
      searches.order(order);
    });

    return () => {
      sortable('#savedSearches', 'destroy');
      LeoKit.closeModal(modal); // Clean up modal on unmount
    };
  }, [searches, onClose]);

  const restoreSearch = (search) => {
    searches.restore(search);
  };

  const savedSearches = searches.views;
  const order = searches.order();

  return (
    <div>
      <div id="savedSearches" className="saved-views">
        {order.length ? (
          order.map((view) => (
            <div key={view} className="workflow-div flex-row flex-space" data-search={view}>
              <i className="icon-menu" />
              <span className="flex-grow" onClick={() => restoreSearch(view)}>
                {view}
              </span>
              <i className="icon-minus-circled pull-right" onClick={() => searches.delete(view)}></i>
            </div>
          ))
        ) : (
          'There are no saved Searches'
        )}
      </div>
    </div>
  );
};

export default SavedSearches;
