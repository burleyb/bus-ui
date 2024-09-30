import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import Dialog from './dialog.jsx'; // Assuming you have a reusable Dialog component

// SortableItem component
const SortableItem = ({ id, value, onRestore, onDelete }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        cursor: 'grab'
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="workflow-div flex-row flex-space"
            data-search={value}
            {...attributes}
            {...listeners}
        >
            <i className="icon-menu" />
            <span className="flex-grow" onClick={onRestore}>
                {value}
            </span>
            <i className="icon-minus-circled pull-right" onClick={onDelete} />
        </div>
    );
};

// Main component for SavedSearches
function SavedSearches({ searches, onClose }) {
    const [savedSearches, setSavedSearches] = useState(searches.views);
    const [order, setOrder] = useState(searches.order());

    useEffect(() => {
        setSavedSearches(searches.views);
        setOrder(searches.order());
    }, [searches]);

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = order.indexOf(active.id);
            const newIndex = order.indexOf(over.id);
            const newOrder = arrayMove(order, oldIndex, newIndex);
            setOrder(newOrder);
            searches.order(newOrder); // Update the order in the parent component/context
        }
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
                <DndContext
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToVerticalAxis]}
                >
                    <SortableContext items={order}>
                        {order.length > 0 ? (
                            order.map((value) => (
                                <SortableItem
                                    key={value}
                                    id={value}
                                    value={value}
                                    onRestore={() => restoreSearch(value)}
                                    onDelete={() => deleteSearch(value)}
                                />
                            ))
                        ) : (
                            <div>There are no saved Searches</div>
                        )}
                    </SortableContext>
                </DndContext>
            </div>
        </Dialog>
    );
}

export default SavedSearches;
