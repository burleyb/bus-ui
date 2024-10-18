import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import Dialog from './dialog.jsx'; // Assuming you have a reusable Dialog component

// Sortable item component using dnd-kit
const SortableItem = ({ id, value, onRestore, onDelete }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        cursor: 'grab',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="workflow-div flex-row flex-space"
            data-view={value}
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

function SavedWorkflows({ workflows, onClose }) {
    const [order, setOrder] = useState(workflows.order());

    useEffect(() => {
        // Update the workflows state if it changes externally
        setOrder(workflows.order());
    }, [workflows]);

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = order.indexOf(active.id);
            const newIndex = order.indexOf(over.id);
            const newOrder = arrayMove(order, oldIndex, newIndex);
            setOrder(newOrder);
            workflows.order(newOrder); // Persist the new order
        }
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
                                    onRestore={() => onRestore(value)}
                                    onDelete={() => onDelete(value)}
                                />
                            ))
                        ) : (
                            <div>There are no saved Workflows</div>
                        )}
                    </SortableContext>
                </DndContext>
            </div>
        </Dialog>
    );
}

export default SavedWorkflows;
