import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import TagsInput from '../elements/tagsInput.jsx';
import { useLeoKit } from './useLeoKit';

function DataSourceConnect({ onClose }) {
    const { alert } = useLeoKit(); // Using useLeoKit to control dialogs
    const [step, setStep] = useState(0);
    const [queueTags, setQueueTags] = useState([]);
    const { control, handleSubmit, formState: { errors }, setValue } = useForm(); // Initializing react-hook-form

    useEffect(() => {
        // Display modal dialog using LeoKit
        const content = (
            <div className="DataSourceConnect">
                <h3><i className="icon-database" /> Connect to a Data Source</h3>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DataSourceForm 
                        step={step} 
                        control={control} 
                        errors={errors} 
                        queueTags={queueTags} 
                        setQueueTags={setQueueTags} 
                        setValue={setValue}
                    />
                    <FormButtonBar step={step} onPrev={onPrev} onNext={onNext} />
                </form>
            </div>
        );

        alert(content, 'Connect to Data Source'); // Show as alert modal
        return () => {
            if (onClose) onClose(); // Close handler
        };
    }, [step, queueTags, onClose]);

    const onSubmit = (data) => {
        console.log('Form submitted', data);
        onNext();
    };

    const onNext = () => {
        setStep((prevStep) => prevStep + 1);
    };

    const onPrev = () => {
        setStep((prevStep) => prevStep - 1);
    };

    return null; // Render nothing since modal is handled by useLeoKit's alert
}

const DataSourceForm = ({ step, control, errors, queueTags, setQueueTags, setValue }) => {
    if (step === 0) {
        return (
            <div>
                <div style={{ maxWidth: 890, padding: 45 }}>
                    <div className="flex-row flex-spread">
                        <div className="theme-section-header">Choose a New Data Source</div>
                        <div>
                            <label className="theme-form-label">Existing Data Sources</label>
                            <select className="theme-form-input">
                                <option>Select an existing data source...</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex-row">
                        <TagsInput name="queue_tags" value={queueTags} onChange={setQueueTags} />
                    </div>
                </div>
            </div>
        );
    } else {
        return (
            <div>
                <div className={`theme-form${step === 3 ? ' active' : ''}`}>
                    <div className="theme-required">
                        <label>Bot name</label>
                        <Controller
                            name="botName"
                            control={control}
                            defaultValue=""
                            render={({ field }) => (
                                <input {...field} className="theme-form-input" />
                            )}
                            rules={{ required: 'Bot name is required' }}
                        />
                        {errors.botName && <span className="error">{errors.botName.message}</span>}
                    </div>
                    <div className="theme-required">
                        <label>Description</label>
                        <Controller
                            name="description"
                            control={control}
                            defaultValue=""
                            render={({ field }) => (
                                <textarea {...field} className="theme-form-input" />
                            )}
                            rules={{ required: 'Description is required' }}
                        />
                        {errors.description && <span className="error">{errors.description.message}</span>}
                    </div>
                    <div>
                        <label>Tags</label>
                        <TagsInput name="queue_tags" value={queueTags} onChange={setQueueTags} />
                    </div>
                    <div className="theme-form-section">
                        <div className="theme-form-group-heading">Bot Settings</div>
                        <div className="theme-required">
                            <label>Collection</label>
                            <Controller
                                name="collection"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <input {...field} className="theme-form-input" />
                                )}
                                rules={{ required: 'Collection is required' }}
                            />
                            {errors.collection && <span className="error">{errors.collection.message}</span>}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
};

const FormButtonBar = ({ step, onPrev, onNext }) => (
    <div className="form-button-bar">
        {step > 1 && (
            <button type="button" className="theme-button pull-left" onClick={onPrev}>
                Prev
            </button>
        )}
        <div className="pull-right">
            <button type="button" className="theme-button">Cancel</button>
            {step === 3 ? (
                <button type="submit" className="theme-button-primary">
                    Create Data Source
                </button>
            ) : (
                <button type="submit" className="theme-button-primary">
                    Next
                </button>
            )}
        </div>
    </div>
);

export default DataSourceConnect;
