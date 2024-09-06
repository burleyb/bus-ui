import React, { useEffect, useRef } from 'react';
import { useDialog } from '../../../stores/DialogContext';

const Dialog = ({ content, title, buttons, onClose, id }) => {
    const { closeDialog } = useDialog();
    const dialogRef = useRef(null);

    const handleClose = () => closeDialog(id, onClose);

    // Center the dialog when it mounts
    useEffect(() => {
        centerDialog();
        window.addEventListener('resize', centerDialog);
        return () => window.removeEventListener('resize', centerDialog);
    }, []);

    const centerDialog = () => {
        const dialog = dialogRef.current;
        if (dialog) {
            const { innerWidth, innerHeight } = window;
            dialog.style.left = `${(innerWidth - dialog.offsetWidth) / 2}px`;
            dialog.style.top = `${(innerHeight - dialog.offsetHeight) / 3}px`;
        }
    };

    return (
        <div className="theme-modal" onClick={(e) => e.target.classList.contains('theme-modal') && handleClose()}>
            <div className="theme-dialog" ref={dialogRef} tabIndex={-1}>
                <header className="theme-dialog-header">
                    <span>{title}</span>
                    <button className="theme-icon-close" onClick={handleClose}>&times;</button>
                </header>
                <main>{content}</main>
                <footer>
                    {Object.keys(buttons).map((buttonLabel, index) => (
                        <button key={index} onClick={() => buttons[buttonLabel]()}>
                            {buttonLabel}
                        </button>
                    ))}
                </footer>
            </div>
        </div>
    );
};

export default Dialog;
