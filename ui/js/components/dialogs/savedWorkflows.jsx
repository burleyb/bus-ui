import React, { useState, useEffect } from 'react';
import { SortableContainer, SortableElement, arrayMove } from 'react-sortable-hoc';
import Dialog from './dialog'; // Assuming you have a reusable Dialog component

// Sortable item
const SortableItem = SortableElement(({ value, onRestore, onDelete }) => (
    <div className="workflow-div flex-row flex-space" data-view={value}>
        <i className="icon-menu" />
        <span className="flex-grow" onClick={onRestore}>
            {value}
        </span>
        <i className="icon-minus-circled pull-right" onClick={onDelete} />
    </div>
));

// Sortable list
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
                <div>There are no saved Workflows</div>
            )}
        </div>
    );
});

function SavedWorkflows({ workflows, onClose }) {
    const [order, setOrder] = useState(workflows.order());

    useEffect(() => {
        // Update the workflows state if it changes externally
        setOrder(workflows.order());
    }, [workflows]);

    const onSortEnd = ({ oldIndex, newIndex }) => {
        const newOrder = arrayMove(order, oldIndex, newIndex);
        setOrder(newOrder);
        workflows.order(newOrder); // Persist the new order
    };

    const onRestore = (view) => {
        workflows.restore(view);
    };

    const onDelete = (view) => {
        const updatedOrder = order.filter((workflow) => workflow !== view);
        setOrder(updatedOrder);
        workflows.delete(view);
    };

    return (
        <Dialog title="Saved Workflows" onClose={onClose}>
            <div id="savedWorkflows" className="saved-views">
                <SortableList
                    items={order}
                    onSortEnd={onSortEnd}
                    onRestore={onRestore}
                    onDelete={onDelete}
                    useDragHandle
                />
            </div>
        </Dialog>
    );
}

export default SavedWorkflows;
