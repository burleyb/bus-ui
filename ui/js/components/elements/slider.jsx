import React, { useState, useEffect, useRef } from 'react';

const Slider = (props) => {
    const trackRef = useRef(null);
    const [state, setState] = useState(init(props));

    useEffect(() => {
        setState(init(props));
    }, [props]);

    function init(props) {
        return {
            min: props.min,
            max: props.max,
            step: props.step,
            left: props.left,
            right: props.right,
        };
    }

    const onChange = (clientX, dropped) => {
        const track = trackRef.current;
        const position = clientX - track.getBoundingClientRect().left;
        const trackWidth = track.offsetWidth;
        let { left, right } = state;

        if (dragElement.current.classList.contains('left-handle')) {
            left = (((position - dragOffset.current) / trackWidth) * (state.max - state.min)) + state.min;
            left = Math.round(left / state.step) * state.step;
            left = Math.max(left, state.min);
            left = Math.min(left, state.max - state.step, state.right - state.step);
        } else if (dragElement.current.classList.contains('right-handle')) {
            right = (((position + dragOffset.current) / trackWidth) * (state.max - state.min)) + state.min;
            right = Math.round(right / state.step) * state.step;
            right = Math.max(right, state.min + state.step, state.left + state.step);
            right = Math.min(right, state.max);
        } else {
            const width = state.right - state.left;
            left = (((position - dragOffset.current) / trackWidth) * (state.max - state.min)) + state.min;
            left = Math.round(left / state.step) * state.step;
            left = Math.max(left, state.min);
            left = Math.min(left, state.max - width);
            right = left + width;
        }

        setState({ ...state, left, right });
        props.onChange && props.onChange({ left, right }, dropped);
    };

    const dragElement = useRef(null);
    const dragOffset = useRef(0);
    const clientXRef = useRef(null);

    const dragStart = (event) => {
        const clientX = event.clientX || (event.touches && event.touches.length ? event.touches[0].clientX : undefined);
        dragElement.current = event.currentTarget;
        dragOffset.current = clientX - event.currentTarget.getBoundingClientRect().left;
        if (event.dataTransfer) {
            event.dataTransfer.setData('text', '');
            event.dataTransfer.setDragImage(new Image(), 0, 0); // Hides the drag image
        }
    };

    const dragOver = (event) => {
        if (dragElement.current) {
            const clientX = event.clientX || (event.touches && event.touches.length ? event.touches[0].clientX : undefined);
            onChange(clientX, false);
        }
    };

    const dragDrop = (event) => {
        onChange(event.clientX || clientXRef.current, true);
    };

    const { min, max, left, right } = state;
    const leftTitle = props.leftTitle || left;
    const rightTitle = props.rightTitle || right;
    const selectionTitle = props.selectionTitle || `${leftTitle} - ${rightTitle}`;
    const width = ((right - left) / (max - min)) * 100;
    const rightPercentage = 100 - ((right - min) / (max - min)) * 100;
    const selectionText = props.selectionText || right - left;

    return (
        <div className="theme-slider">
            <label>{props.minText}</label>

            <div
                className={`track ticks-${state.step}`}
                ref={trackRef}
                onDragOver={dragOver}
                onTouchMove={dragOver}
            >
                <div className="selection" style={{ width: `${width}%`, right: `${rightPercentage}%` }}>
                    <span
                        className="left-handle"
                        draggable="true"
                        data-title={leftTitle}
                        onTouchStart={dragStart}
                        onTouchEnd={dragDrop}
                        onDragStart={dragStart}
                        onDragEnd={dragDrop}
                    />
                    <span
                        className="text"
                        draggable="true"
                        data-title={selectionTitle}
                        onTouchStart={dragStart}
                        onTouchEnd={dragDrop}
                        onDragStart={dragStart}
                        onDragEnd={dragDrop}
                    >
                        {selectionText}
                    </span>
                    <span
                        className="right-handle"
                        draggable="true"
                        data-title={rightTitle}
                        onTouchStart={dragStart}
                        onTouchEnd={dragDrop}
                        onDragStart={dragStart}
                        onDragEnd={dragDrop}
                    />
                </div>
            </div>

            <label>{props.maxText}</label>
        </div>
    );
};

export default Slider;
