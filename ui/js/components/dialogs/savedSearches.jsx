import React, { useState, useEffect } from 'react';
import { SortableContainer, SortableElement, arrayMove } from 'react-sortable-hoc';
import Dialog from './dialog'; // Assuming you have a reusable Dialog component

const SortableItem = SortableElement(({ value, onRestore, onDelete }) => (
    <div className="workflow-div flex-row flex-space" data-search={value}>
        <i className="icon-menu" />
        <span className="flex-grow" onClick={onRestore}>
            {value}
        </span>
        <i className="icon-minus-circled pull-right" onClick={onDelete} />
    </div>
));

const SortableList = SortableContainer(({ items, onRestore, onDelete }) => {
    return (
        <div>
            {items.length > 0 ? (
                items.map((value, index) => (
                    <SortableItem
                        key={`item-${value}`}
                        index={index}
                        value={value}
                        onRestore={() => onRestore(value)}
                        onDelete={() => onDelete(value)}
                    />
                ))
            ) : (
                <div>There are no saved Searches</div>
            )}
        </div>
    );
});

function SavedSearches({ searches, onClose }) {
    const [savedSearches, setSavedSearches] = useState(searches.views);
    const [order, setOrder] = useState(searches.order());

    useEffect(() => {
        // Optionally, load saved searches if necessary
        setSavedSearches(searches.views);
        setOrder(searches.order());
    }, [searches]);

    const onSortEnd = ({ oldIndex, newIndex }) => {
        const newOrder = arrayMove(order, oldIndex, newIndex);
        setOrder(newOrder);
        searches.order(newOrder); // Update the order in the parent component/context
    };

    const restoreSearch = (search) => {
        searches.restore(search);
    };

    const deleteSearch = (search) => {
        const updatedOrder = order.filter((view) => view !== search);
        setOrder(updatedOrder);
        searches.delete(search);
    };

    return (
        <Dialog title="Saved Searches" onClose={onClose}>
            <div id="savedSearches" className="saved-views">
                <SortableList
                    items={order}
                    onSortEnd={onSortEnd}
                    onRestore={restoreSearch}
                    onDelete={deleteSearch}
                    useDragHandle
                />
            </div>
        </Dialog>
    );
}

export default SavedSearches;
