import React, { useState, useEffect } from 'react';

const TagsInput = (props) => {
  const [tags, setTags] = useState((props.value || props.defaultValue || '').toString().split(','));
  const [tag, setTag] = useState('');

  // When props update (alerts or tags change)
  useEffect(() => {
    if (props.alerts) {
      const obj = props.tags?.tags || {};
      const newTags = Object.keys(obj).filter((tag) => obj[tag].includes(props.arn));
      setTags(newTags);
    }
  }, [props.alerts, props.tags, props.arn]);

  const addTag = (newTag) => {
    const trimmedTags = newTag.split(',').filter((t) => t.trim());
    if (props.alerts) {
      const body = { delete: false, addedTag: newTag, ...props.tags };
      fetch(`api/sns_save/tags/${props.arn}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
        .then((response) => response.json())
        .then((responseTags) => {
          props.tags.tags = responseTags;
          setTags((prevTags) => [...prevTags, ...trimmedTags]);
          setTag('');
        })
        .catch(() => {
          window.messageLogModal('Unable to update tags', 'error');
        });
    } else {
      setTags((prevTags) => [...prevTags, ...trimmedTags]);
      setTag('');
    }
  };

  const handleChange = (event) => {
    const newTag = event.currentTarget.value;
    if (newTag.includes(',')) {
      addTag(newTag);
    } else {
      setTag(newTag);
      props.onChange && props.onChange();
    }
  };

  const handleKeyDown = (event) => {
    if (event.keyCode === 13) {
      addTag(event.currentTarget.value);
    }
  };

  const handleBlur = (event) => {
    addTag(event.currentTarget.value);
  };

  const removeTag = (index) => {
    const updatedTags = [...tags];
    updatedTags.splice(index, 1);
    if (props.alerts) {
      const body = { delete: true, tagsToKeep: updatedTags, ...props.tags };
      fetch(`api/sns_save/tags/${props.arn}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
        .then((response) => response.json())
        .then((responseTags) => {
          props.tags.tags = responseTags;
          setTags(updatedTags);
        })
        .catch(() => {
          window.messageLogModal('Unable to update tags', 'error');
        });
    } else {
      setTags(updatedTags);
    }
  };

  return (
    <div className="theme-tags" title={props.title} onClick={() => document.querySelector('input[type="text"]').focus()}>
      <input type="hidden" name={props.name} value={tags.join(',')} readOnly />
      <div className="flex-row">
        <div>
          {tags.map((t, index) => (
            t && (
              <span key={index}>
                {t}
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
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
          />
        )}
      </div>
    </div>
  );
};

export default TagsInput;
