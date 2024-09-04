import React, { useState, useEffect } from 'react';
import Trigger from '../elements/trigger.jsx';
import NodeSearch from '../elements/nodeSearch.jsx';
import TagsInput from '../elements/tagsInput.jsx';
import ListInput from '../elements/listInput.jsx';
import SubQueue from '../elements/subQueue.jsx';

const DynamicFormRow = ({ field, fieldName, defaults, setRequiredFields, showAdvanced, onChange, resetOverrides }) => {
    const [fieldData, setFieldData] = useState(field);
    const [fieldKey, setFieldKey] = useState(fieldName);

    useEffect(() => {
        setFieldData(field);
        setFieldKey(fieldName);
    }, [field, fieldName]);

    const invocationTypeChange = (event) => {
        const updatedField = { ...fieldData, placeholder: event.currentTarget.value };
        setFieldData(updatedField);
        updatedField.onChange && updatedField.onChange(event.currentTarget.value);
    };

    if (typeof fieldData === 'string') {
        fieldData = { type: fieldData, required: true };
    } else if (Array.isArray(fieldData)) {
        fieldData = { type: 'select', required: true, values: fieldData };
    }

    fieldData.name = fieldData.name || fieldKey;
    fieldData.label = fieldData.label || fieldKey;
    fieldData.type = fieldData.type || 'text';
    fieldData.onChange = fieldData.onChange || onChange;

    if (fieldData.advanced && !showAdvanced) {
        return <input type="hidden" name={fieldData.name} value={fieldData.value || ''} readOnly />;
    }

    fieldData.label = (fieldData.label || '').replace(/_/g, ' ');

    if (defaults[fieldData.name]) {
        fieldData.value = defaults[fieldData.name];
    }

    const renderField = () => {
        switch (fieldData.type.toLowerCase()) {
            case 'readonly':
                return (
                    <span>
                        <span title={fieldData.title} className={`no-wrap theme-color-${fieldData.color || 'gray'}`}>
                            {fieldData.text || fieldData.value}
                        </span>
                        <input name={fieldData.name} type="hidden" value={fieldData.value || ''} readOnly />
                    </span>
                );
            case 'hidden':
                return <input name={fieldData.name} type="hidden" value={fieldData.value || ''} readOnly />;
            case 'textarea':
                return (
                    <textarea
                        name={fieldData.name}
                        placeholder={fieldData.placeholder || ''}
                        value={fieldData.value || ''}
                        readOnly={fieldData.readOnly}
                        onChange={fieldData.onChange}
                    />
                );
            case 'checkbox':
                return <input type="checkbox" value={fieldData.value} onChange={fieldData.onChange} />;
            case 'tags':
                return <TagsInput name={fieldData.name} value={fieldData.value || ''} onChange={fieldData.onChange} />;
            case 'select':
                return (
                    <select name={fieldData.name} value={fieldData.value} onChange={fieldData.onChange}>
                        {Object.keys(fieldData.values || []).map((value, key) => (
                            <option key={key} value={fieldData.values.length ? fieldData.values[value] : value}>
                                {fieldData.values[value]}
                            </option>
                        ))}
                    </select>
                );
            case 'trigger':
                return <Trigger values={fieldData.values} value={fieldData.value} onChange={fieldData.onChange} />;
            case 'autocomplete':
                return (
                    <NodeSearch
                        name={fieldData.name}
                        value={fieldData.value}
                        nodeType={fieldData.nodeType}
                        onChange={fieldData.onChange}
                    />
                );
            case 'list':
                return <ListInput name={fieldData.name} value={fieldData.value || ''} onChange={fieldData.onChange} />;
            case 'subqueue':
                return <SubQueue name={fieldData.name} value={fieldData.value || ''} onChange={fieldData.onChange} />;
            default:
                return (
                    <input
                        name={fieldData.name}
                        type={fieldData.type}
                        placeholder={fieldData.placeholder || ''}
                        value={fieldData.value || ''}
                        onChange={fieldData.onChange}
                    />
                );
        }
    };

    return (
        <div className={fieldData.required ? 'theme-required' : ''}>
            {fieldData.label !== 'hidden' && <label>{fieldData.label}</label>}
            {renderField()}
        </div>
    );
};

export default DynamicFormRow;
