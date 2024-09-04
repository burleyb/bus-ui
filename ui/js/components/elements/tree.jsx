import React, { useState, useEffect, useRef, useContext } from 'react';
import { TreeContext } from '../context/TreeContext'; // Assuming you are using Context API for state management
import Trunk from '../elements/trunk';
import { NodeImages } from '../elements/nodeIcon';
import NoSource from '../elements/noSource';
import _ from 'lodash';
import * as d3 from 'd3';

const scales = [0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1, 1.125, 1.25, 1.375, 1.5, 1.625, 1.75, 1.875, 2.0];
const ICON_SIZE = 30;
const NODE_SPREAD = 125;
const MAX_DURATION = 750;

const Tree = ({ id, root, source, force, nodeSearch, treeButtons, treeButtonsRight }) => {
    const { dataStore, settings, dispatch } = useContext(TreeContext); // Using context instead of props
    const [zoom, setZoom] = useState(settings.zoom || 1);
    const [offsetDistance, setOffsetDistance] = useState(settings.offset || [0, 0]);
    const treeWrapperRef = useRef(null);
    const svgRef = useRef(null);

    useEffect(() => {
        const treeWrapper = d3.select(`#${id}`);
        const svg = d3.select(`#${id} svg`);
        initializeTree(svg, treeWrapper);

        window.addEventListener('resize', handleWindowResize);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('resize', handleWindowResize);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [root, force]);

    const initializeTree = (svg, treeWrapper) => {
        const width = treeWrapper.node().getBoundingClientRect().width;
        const height = treeWrapper.node().getBoundingClientRect().height;

        // Initialize tree layout and D3 configurations here

        svg.attr('width', width).attr('height', height);

        // Additional D3 setup and rendering logic can go here...
    };

    const handleWindowResize = () => {
        // Logic to handle window resizing and adjusting tree layout
        updateDiagram(root, true);
    };

    const handleVisibilityChange = () => {
        if (!document.hidden) {
            updateDiagram(root, true);
        }
    };

    const zoomIn = () => {
        if (zoom < scales.length - 1) {
            const newZoom = scales[zoom + 1];
            setZoom(newZoom);
            setOffsetDistance([0, 0]); // Adjust offset if necessary
        }
    };

    const zoomOut = () => {
        if (zoom > 0) {
            const newZoom = scales[zoom - 1];
            setZoom(newZoom);
            setOffsetDistance([0, 0]); // Adjust offset if necessary
        }
    };

    const updateDiagram = (newRoot, forceUpdate = false) => {
        if (newRoot !== root || forceUpdate) {
            // Handle D3 logic to update the diagram with the new root node and layout
            // Handle node and link rendering using D3.js
        }
    };

    return (
        <div id={id} className="tree-wrapper" onClick={() => hideHover()}>
            <div className="tree-buttons top-controls">
                <div>
                    {nodeSearch || false}
                    <div className="theme-icon-group control">
                        <i className={`icon-zoom-in ${zoom > 1 ? 'active' : ''}`} onClick={zoomIn}></i>
                        <i className={`icon-target ${zoom === 1 ? 'active' : ''}`} onClick={() => setZoom(1)}></i>
                        <i className={`icon-zoom-out ${zoom < 1 ? 'active' : ''}`} onClick={zoomOut}></i>
                    </div>
                    {treeButtons || false}
                </div>
                {treeButtonsRight || false}
            </div>
            <svg ref={svgRef}>
                <clipPath id="clipCircle30">
                    <circle r="25" cx="0" cy="0" />
                </clipPath>
                <clipPath id="clipCircle21">
                    <circle r="16" cx="0" cy="0" />
                </clipPath>
                <Trunk className="left-side" />
                <Trunk className="right-side" />
                <Trunk className="hoverBoard" style={{ filter: 'url(#hoverDropshadow)', display: 'none' }} />
                <filter id="hoverDropshadow" height="130%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
                    <feOffset dx="2" dy="2" result="offsetblur" />
                    <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <NoSource root={root} transform={`translate(${svgRef.current?.width / 2}, ${svgRef.current?.height / 2 + 125})`} />
            </svg>
        </div>
    );
};

export default Tree;
