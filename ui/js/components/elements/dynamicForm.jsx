import React, { useState } from 'react';
import DynamicFormRow from './DynamicFormRow';

const DynamicForm = ({ form, className, toggleAdvanced, defaults, setRequiredFields, onChange, resetOverrides }) => {
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleToggleAdvanced = () => {
        setShowAdvanced(!showAdvanced);
        toggleAdvanced && toggleAdvanced(!showAdvanced);
    };

    const advanced = { section: {} };

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
                    <button type="button" className="theme-button" onClick={handleToggleAdvanced}>
                        {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
                    </button>
                </div>
            )}
        </div>
    );
};

export default DynamicForm;
