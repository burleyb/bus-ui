import React, { useState, useEffect, useCallback } from 'react';

const Slider = (props) => {
  const [sliderState, setSliderState] = useState(init(props));
  const [dragElement, setDragElement] = useState(null);
  const [clientX, setClientX] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);

  useEffect(() => {
    setSliderState(init(props));
  }, [props]);

  const init = (props) => ({
    min: props.min,
    max: props.max,
    step: props.step,
    left: props.left,
    right: props.right,
  });

  const onChange = useCallback(
    (currentX, dropped) => {
      const track = document.querySelector('.theme-slider .track');
      const position = currentX - track.getBoundingClientRect().left;
      const trackWidth = track.offsetWidth;
      let { left, right } = sliderState;

      if (dragElement.classList.contains('left-handle')) {
        left = ((position - dragOffset) / trackWidth) * (sliderState.max - sliderState.min) + sliderState.min;
        left = Math.round(left / sliderState.step) * sliderState.step;
        left = Math.max(left, sliderState.min);
        left = Math.min(left, sliderState.max - sliderState.step, right - sliderState.step);
      } else if (dragElement.classList.contains('right-handle')) {
        right = ((position + dragOffset) / trackWidth) * (sliderState.max - sliderState.min) + sliderState.min;
        right = Math.round(right / sliderState.step) * sliderState.step;
        right = Math.max(right, sliderState.min + sliderState.step, left + sliderState.step);
        right = Math.min(right, sliderState.max);
      } else {
        const width = right - left;
        left = ((position - dragOffset) / trackWidth) * (sliderState.max - sliderState.min) + sliderState.min;
        left = Math.round(left / sliderState.step) * sliderState.step;
        left = Math.max(left, sliderState.min);
        left = Math.min(left, sliderState.max - width);
        right = left + width;
      }

      setSliderState({ ...sliderState, left, right });
      props.onChange && props.onChange({ left, right }, dropped);
    },
    [dragElement, dragOffset, sliderState, props]
  );

  const dragStart = (event) => {
    const startX = event.clientX || (event.touches && event.touches.length ? event.touches[0].clientX : undefined);
    setClientX(startX);
    setDragElement(event.currentTarget);
    setDragOffset(startX - event.currentTarget.getBoundingClientRect().left);

    if (event.dataTransfer) {
      event.dataTransfer.setData('text', '');
      event.dataTransfer.setDragImage(new Image(), 0, 0);
    }
  };

  const dragOver = (event) => {
    const currentX = event.clientX || (event.touches && event.touches.length ? event.touches[0].clientX : undefined);
    if (dragElement) {
      onChange(currentX, false);
    }
  };

  const dragDrop = (event) => {
    onChange(event.clientX || clientX, true);
    setDragElement(null);
  };

  const { min, max, left, right } = sliderState;
  const width = ((right - left) / (max - min)) * 100;
  const rightOffset = 100 - ((right - min) / (max - min)) * 100;
  const leftTitle = props.leftTitle || left;
  const rightTitle = props.rightTitle || right;
  const selectionText = props.selectionText || right - left;

  return (
    <div className="theme-slider">
      <label>{props.minText}</label>
      <div className={`track ticks-${sliderState.step}`} onDragOver={dragOver} onTouchMove={dragOver}>
        <div className="selection" style={{ width: `${width}%`, right: `${rightOffset}%` }}>
          <span
            className="left-handle"
            draggable="true"
            data-title={leftTitle}
            onTouchStart={dragStart}
            onTouchEnd={dragDrop}
            onDragStart={dragStart}
            onDragEnd={dragDrop}
          ></span>
          <span
            className="text"
            draggable="true"
            data-title={`${leftTitle} - ${rightTitle}`}
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
          ></span>
        </div>
      </div>
      <label>{props.maxText}</label>
    </div>
  );
};

export default Slider;
