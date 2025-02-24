import React from 'react';

export default function LanguageSelector({ languages, selected, onSelect }) {
  return (
    <div className="flex border-b">
      {languages.map(lang => (
        <button
          key={lang}
          onClick={() => onSelect(lang)}
          className={`px-6 py-3 font-medium text-sm border-b-2 -mb-px ${
            selected === lang
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {lang}
        </button>
      ))}
    </div>
    );
}
