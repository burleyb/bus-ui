import React from 'react';
import { useDialog } from './DialogContext';
import Dialog from './Dialog';

export const useLeoKit = () => {
    const { openDialog, closeDialog } = useDialog();

    const alert = (message, type = '') => {
        openDialog(() => (
            <Dialog
                title="Alert"
                content={<div>{message}</div>}
                buttons={{
                    OK: () => closeDialog()
                }}
            />
        ));
    };

    const confirm = (message, onConfirm, onCancel = () => {}) => {
        openDialog(() => (
            <Dialog
                title="Confirm"
                content={<div>{message}</div>}
                buttons={{
                    OK: onConfirm,
                    Cancel: onCancel
                }}
            />
        ));
    };

    const prompt = (title, label, defaultValue = '', onSubmit, onCancel = () => {}) => {
        openDialog(() => (
            <Dialog
                title={title}
                content={
                    <div>
                        <label>{label}</label>
                        <input
                            type="text"
                            defaultValue={defaultValue}
                            id="prompt-input"
                        />
                    </div>
                }
                buttons={{
                    OK: () => {
                        const value = document.getElementById('prompt-input').value;
                        onSubmit(value);
                        closeDialog();
                    },
                    Cancel: onCancel
                }}
            />
        ));
    };

    return { alert, confirm, prompt };
};
