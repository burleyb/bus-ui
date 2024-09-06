import React, { useState } from 'react';
import Trigger from '../elements/trigger.jsx';
import NodeSearch from '../elements/nodeSearch.jsx';
import TagsInput from '../elements/tagsInput.jsx';
import ListInput from '../elements/listInput.jsx';
import SubQueue from '../elements/subQueue.jsx';
import ComboBox from '../elements/comboBox.jsx';
import TimePeriod from '../elements/timePeriod.jsx';

const DynamicForm = ({ form, className, toggleAdvanced, resetOverrides, id, defaults, setRequiredFields, onChange }) => {
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleShowAdvanced = () => {
        setShowAdvanced(!showAdvanced);
        if (toggleAdvanced) {
            toggleAdvanced(!showAdvanced);
        }
    };

    // Processing advanced fields
    let advanced = { section: {} };
    Object.keys(form).forEach((fieldName) => {
        if (form[fieldName].advanced) {
            advanced.section[fieldName] = form[fieldName];
        } else if (form[fieldName].section) {
            Object.keys(form[fieldName].section).forEach((sectionFieldName) => {
                if (form[fieldName].section[sectionFieldName].advanced) {
                    advanced.section[sectionFieldName] = form[fieldName].section[sectionFieldName];
                    delete form[fieldName].section[sectionFieldName];
                }
            });
        }
    });

    if (Object.keys(advanced.section).length) {
        form.advanced = advanced;
    }

    return (
        <div className={className || 'theme-form'}>
            {Object.keys(form).map((fieldName) => (
                <DynamicFormRow
                    key={fieldName}
                    resetOverrides={resetOverrides}
                    id={id}
                    fieldName={fieldName}
                    field={form[fieldName]}
                    defaults={defaults}
                    setRequiredFields={setRequiredFields}
                    showAdvanced={showAdvanced}
                    onChange={onChange}
                />
            ))}

            {form.advanced && (
                <div>
                    <label />
                    <button type="button" className="theme-button" onClick={handleShowAdvanced}>
                        {showAdvanced ? 'Hide Advanced Fields' : 'Show Advanced Fields'}
                    </button>
                </div>
            )}
        </div>
    );
};

const DynamicFormRow = ({ fieldName, field, onChange }) => {
    // Dynamically rendering form elements based on field type
    return (
        <div>
            <label>{fieldName}</label>
            {(() => {
                switch (field.type) {
                    case 'tags': 
                    case 'tag':
                        return <TagsInput name={field.name} placeholder={field.placeholder || ''} title={field.title} value={field.value || ''} readOnly={field.readOnly} pattern={field.pattern} onChange={onChange} />;
                    
                    case 'text': 
                    case 'number': 
                    case 'url':
                        return <input name={field.name} type={field.type} placeholder={field.placeholder || ''} title={field.title} value={field.value || ''} readOnly={field.readOnly} pattern={field.pattern} onChange={onChange} />;
                    
                    case 'textoverrides':
                        return (
                            <div>
                                <input type={field.type2} value={field.value} id={field.id} onClick={field.onClick} style={field.style2} />
                                <input disabled={!field.disabled} name={field.name} type={field.type} value={field.value || ''} onChange={onChange} style={field.style} />
                            </div>
                        );
                    
                    case 'errorpercent':
                        return (
                            <div>
                                <input type={field.type2} value={field.value} id={field.id} onClick={field.onClick} style={field.style2} />
                                <input disabled={!field.disabled} name={field.name} type={field.valueType} min='0' max='100' value={field.value || ''} onChange={onChange} style={field.style} />
                                <span className="no-wrap text-middle">%</span>
                            </div>
                        );
                    
                    case 'select': 
                    case 'selectbox':
                        return (
                            <select name={field.name} title={field.title} value={field.value} onChange={onChange}>
                                {Object.keys(field.values || []).map((value, key) => (
                                    <option key={key} value={field.values.length ? field.values[value] : value}>
                                        {field.values[value]}
                                    </option>
                                ))}
                            </select>
                        );
                    
                    case 'trigger':
                        return <Trigger values={field.values} value={field.value} onChange={onChange} />;
                    
                    case 'invocation':
                        return [
                            <select key="0" name="invocationType" title={field.title} value={field.value} onChange={onChange}>
                                {Object.keys(field.values || []).map((value, key) => (
                                    <option key={key} value={field.values.length ? field.values[value] : value}>
                                        {field.values[value]}
                                    </option>
                                ))}
                            </select>,
                            <div key="1">
                                <input name="lambdaName" placeholder={field.placeholder || (field.values || [])[0] || ''} title={field.title} value={field.lambdaName} readOnly={field.readOnly} pattern={field.pattern} onChange={onChange} />
                            </div>
                        ];
                    
                    case 'autocomplete':
                        return <NodeSearch name={field.name} value={field.value} className="display-inline-block" nodeType={field.nodeType} matches={field.matches} onChange={onChange} />;
                    
                    case 'list':
                        return <ListInput name={field.name} placeholder={field.placeholder || ''} title={field.title} value={field.value || ''} readOnly={field.readOnly} pattern={field.pattern} onChange={onChange} />;
                    
                    case 'subqueue':
                        return <SubQueue name={field.name} nodeType={field.nodeType || 'systems'} placeholder={field.placeholder || ''} title={field.title} value={field.value || ''} readOnly={field.readOnly} pattern={field.pattern} onChange={onChange} />;
                    
                    default:
                        return <input type="text" name={field.name} value={field.value} placeholder={field.placeholder} onChange={onChange} />;
                }
            })()}
            {!field.group && field.help && (
                <div className="help-rollover">
                    <i className="icon-help-circled"></i>
                    <span dangerouslySetInnerHTML={{ __html: field.help }} />
                </div>
            )}
            {!field.group && field.description && (
                <small className="field-description" dangerouslySetInnerHTML={{ __html: field.description }} />
            )}
        </div>
    );
};

export default DynamicForm;
