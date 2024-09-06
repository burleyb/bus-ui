import React, { useEffect, useRef, useContext } from 'react';
import * as d3 from 'd3';
import { DataContext } from '../../../stores/DataContext'; // Assuming React Context for global state
import Trunk from './Trunk.jsx'; // Assuming a custom component
import NoSource from './NoSource.jsx'; // Assuming a custom component

const Tree = ({ root, source, onCollapse, onNodeClick, onNodeDblClick, getParents, getKids, treeButtonsRight, hideLinkBelow }) => {
    const { state } = useContext(DataContext); // Using React Context for state management
    const treeRef = useRef(null); // Reference to the SVG element
    const nodeTree = useRef({
        zoom: 1,
        width: 0,
        height: 0,
        root: null,
    });

    useEffect(() => {
        if (treeRef.current) {
            initD3Tree(); // Initialize D3 tree rendering
        }
    }, [root, source]);

    const initD3Tree = () => {
        const svg = d3.select(treeRef.current);

        // Set up the basic dimensions of the tree
        nodeTree.current.width = treeRef.current.clientWidth;
        nodeTree.current.height = treeRef.current.clientHeight;

        const g = svg.append('g').attr('transform', `translate(${nodeTree.current.width / 2}, 50)`);

        const treeLayout = d3.tree().size([nodeTree.current.height - 100, nodeTree.current.width - 200]);

        const rootNode = d3.hierarchy(source);
        treeLayout(rootNode);

        // Create links between nodes
        const links = g.selectAll('.link')
            .data(rootNode.links())
            .enter()
            .append('path')
            .attr('class', 'link')
            .attr('d', d3.linkHorizontal()
                .x(d => d.y)
                .y(d => d.x)
            );

        // Create nodes
        const nodes = g.selectAll('.node')
            .data(rootNode.descendants())
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.y},${d.x})`)
            .on('click', (event, d) => onNodeClick(d.data))
            .on('dblclick', (event, d) => onNodeDblClick(d.data));

        nodes.append('circle')
            .attr('r', 10)
            .attr('class', 'node-circle');

        nodes.append('text')
            .attr('dy', 3)
            .attr('x', d => d.children ? -12 : 12)
            .style('text-anchor', d => d.children ? 'end' : 'start')
            .text(d => d.data.name);

        // Zoom and pan functionality
        const zoom = d3.zoom()
            .scaleExtent([0.5, 3])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });

        svg.call(zoom);

        // Allow resetting zoom
        nodeTree.current.zoom = zoom;
    };

    const zoomIn = () => {
        if (nodeTree.current.zoom) {
            nodeTree.current.zoom.scaleBy(d3.select(treeRef.current), 1.2);
        }
    };

    const zoomOut = () => {
        if (nodeTree.current.zoom) {
            nodeTree.current.zoom.scaleBy(d3.select(treeRef.current), 0.8);
        }
    };

    const zoomReset = () => {
        if (nodeTree.current.zoom) {
            d3.select(treeRef.current).transition().duration(750).call(nodeTree.current.zoom.transform, d3.zoomIdentity);
        }
    };

    const hideHover = (event) => {
        if (!event || event.target.tagName.toLowerCase() === 'svg') {
            d3.select('.hoverBoard').style('display', 'none');
        }
    };

    return (
        <div id={root} className="tree-wrapper" onClick={hideHover}>
            <div className="tree-buttons top-controls">
                <div>
                    <div className="theme-icon-group control">
                        <i className={`icon-zoom-in ${nodeTree.current.zoom > 1 ? 'active' : ''}`} onClick={zoomIn}></i>
                        <i className={`icon-target ${nodeTree.current.zoom === 1 ? 'active' : ''}`} onClick={zoomReset}></i>
                        <i className={`icon-zoom-out ${nodeTree.current.zoom < 1 ? 'active' : ''}`} onClick={zoomOut}></i>
                    </div>
                </div>
                {treeButtonsRight || false}
            </div>
            <svg ref={treeRef} width="100%" height="100%">
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
                <NoSource root={nodeTree.current.root} transform={`translate(${nodeTree.current.width / 2}, ${nodeTree.current.height / 2 + 125})`} />
            </svg>
        </div>
    );
};

export default Tree;
