import React, { useState, useEffect, useContext } from 'react';
import { DataContext } from '../../stores/DataContext'; // Assuming you're using React Context for global state
import axios from 'axios'; // Replacing jQuery's $.post with Axios

const TagsInput = (props) => {
    const { topicInfo } = useContext(DataContext); // Replacing MobX inject with React Context
    const [tags, setTags] = useState((props.value || props.defaultValue || '').toString().split(','));
    const [tag, setTag] = useState('');

    useEffect(() => {
        if (props.alerts) {
            const obj = props.tags?.tags || {};
            const newTags = Object.keys(obj).filter(tagKey => obj[tagKey].includes(props.arn));
            setTags(newTags);
        }
    }, [props.alerts, props.tags, props.arn]);

    const addTag = (newTag) => {
        if (newTag === '') return;

        const bool = props.alerts || false;
        const newTags = tags.concat(newTag.split(',').filter(t => t.trim()));

        if (bool) {
            const body = { ...props.tags, delete: false, addedTag: newTag };
            axios.post(`api/sns_save/tags/${props.arn}`, JSON.stringify(body))
                .then(response => {
                    if (topicInfo && topicInfo.tags) {
                        topicInfo.tags.tags = response.data;
                    }
                    setTags(newTags);
                    setTag('');
                })
                .catch(err => {
                    window.messageLogModal('Unable to update tags', 'error', err);
                });
        } else {
            setTags(newTags);
            setTag('');
        }
    };

    const removeTag = (index) => {
        const bool = props.alerts || false;
        const updatedTags = tags.filter((_, i) => i !== index);

        if (bool) {
            const body = { ...props.tags, delete: true, tagsToKeep: updatedTags };
            axios.post(`api/sns_save/tags/${props.arn}`, JSON.stringify(body))
                .then(response => {
                    if (topicInfo && topicInfo.tags) {
                        topicInfo.tags.tags = response.data;
                    }
                    setTags(updatedTags);
                })
                .catch(err => {
                    window.messageLogModal('Unable to update tags', 'error', err);
                });
        } else {
            setTags(updatedTags);
        }
    };

    const handleInputChange = (e) => {
        const newTag = e.target.value;
        if (newTag.includes(',')) {
            addTag(newTag);
        } else {
            setTag(newTag);
            props.onChange && props.onChange();
        }
    };

    const handleKeyDown = (e) => {
        if (e.keyCode === 13) {
            addTag(e.target.value);
        }
    };

    const handleBlur = (e) => {
        addTag(e.target.value);
    };

    return (
        <div className="theme-tags" title={props.title} onClick={() => document.querySelector('input[type="text"]').focus()}>
            <input type="hidden" name={props.name} value={tags.join(',') || ''} readOnly />
            <div className="flex-row">
                <div>
                    {tags.map((tagItem, index) => (
                        tagItem && (
                            <span key={index}>
                                {tagItem}
                                <i className="icon-cancel" onClick={() => removeTag(index)} />
                            </span>
                        )
                    ))}
                </div>
                {!props.readOnly && (
                    <input
                        type="text"
                        placeholder={props.placeholder || 'type new tag'}
                        value={tag}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onBlur={handleBlur}
                    />
                )}
            </div>
        </div>
    );
};

export default TagsInput;
