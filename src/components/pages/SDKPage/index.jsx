import React, { useState } from 'react';
import { useData } from '../../../stores/DataContext';
import SDKConfig from './SDKConfig';
import CodeExamples from './CodeExamples';
import LanguageSelector from './LanguageSelector';

const SUPPORTED_LANGUAGES = ['nodejs', 'python', 'java', 'go'];

export default function SDKPage() {
  const { sdkConfig } = useData();
  const [selectedLanguage, setSelectedLanguage] = useState('nodejs');

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm">
        <LanguageSelector
          languages={SUPPORTED_LANGUAGES}
          selected={selectedLanguage}
          onSelect={setSelectedLanguage}
        />
        <div className="p-6">
          <SDKConfig config={sdkConfig} language={selectedLanguage} />
          <CodeExamples language={selectedLanguage} />
        </div>
      </div>
    </div>
  );
}
