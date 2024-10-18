import React, { useContext } from 'react';
import { useData } from '../../stores/DataContext.jsx'; // Assuming DataContext for global state

function getImages(node, dataStore, overwrites) {
    if (!node) return '';

    if (node === 'add') {
        node = { type: 'add' };
    } else if (node === 'infinite') {
        node = { type: 'infinite' };
    } else if (typeof node !== 'object') {
        node = dataStore.nodes[node] || {};
    }

    if (overwrites) {
        node = { ...node, ...overwrites }; // Replace jQuery extend with spread operator
        if (overwrites.paused === true && node.status === 'running') {
            node.status = 'paused';
        } else if (overwrites.paused === false && node.status === 'paused') {
            node.status = 'running';
        }
    }

    switch (node.type) {
        case 'add': {
            return [`${window.leostaticcdn}images/icons/addNode.png`];
        }
        case 'infinite': {
            return [`${window.leostaticcdn}images/icons/infinite.png`];
        }
        case 'system':
        case 'queue': {
            const icon = node.icon || `${node.type}${node.archived ? '-archived' : ''}.png`;
            return [
                `${!icon.match(/^https?:/) ? `${window.leostaticcdn}images/${icon.indexOf('/') !== -1 ? '' : 'nodes/'}${icon}` : icon}`,
                ];
        }
        case 'icon': {
            return [node.icon];
        }
        default:
        case 'bot': {
            let templateIcon = false;
            switch (node.templateId) {
                // Add template-specific icons here, if needed
                default:
                    break;
            }

            const mainIcon = node.icon || `${node.type || 'bot'}${!node.status || node.status === 'running' ? '' : `-${node.status}`}${node.paused && node.status !== 'paused' ? '-paused' : ''}.png`;
            const fullMainIcon = `${!mainIcon.match(/^https?:/) ? `${window.leostaticcdn}images/${mainIcon.indexOf('/') !== -1 ? '' : 'nodes/'}${mainIcon}` : mainIcon}`;

            return [fullMainIcon, node.paused ? false : false, templateIcon || false];
        }
    }
}

export function NodeImages(node, dataStore, overwrites) {
    let images = getImages(node, dataStore, overwrites);

    return `<image xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="${images[0]}" width="100%" height="100%"></image>`
        + (images[1] ? `<image xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="${images[1]}" width="33%" height="33%"></image>` : '')
        + (images[2] ? `<image xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="${images[2]}" x="66%" y="66%" width="33%" height="33%"></image>` : '');
}

const NodeIcon = ({ node, className, width, height, size, overwrites }) => {
    const dataStore = useData(); // Using React Context for dataStore
    const images = getImages(node, dataStore, overwrites);

    return (
        <svg className={className} width={width || size} height={height || size}>
            <image xmlnsXlink="http://www.w3.org/1999/xlink" xlinkHref={images[0]} width="100%" height="100%" />
            {images[1] && <image xmlnsXlink="http://www.w3.org/1999/xlink" xlinkHref={images[1]} width="33%" height="33%" />}
        </svg>
    );
};

export default NodeIcon;
