"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BotSettingsTabProps {
  nodeData: any;
}

export default function BotSettingsTab({ nodeData }: BotSettingsTabProps) {
  const [name, setName] = useState(nodeData?.name || '');
  const [description, setDescription] = useState(nodeData?.description || '');
  const [autoScale, setAutoScale] = useState(nodeData?.autoScale === true);
  const [maxConcurrency, setMaxConcurrency] = useState(nodeData?.maxConcurrency || 10);
  const [isDirty, setIsDirty] = useState(false);
  
  // Safeguard against null nodeData
  if (!nodeData) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-500">No data available</div>
      </div>
    );
  }

  // Handle save
  const handleSave = () => {
    // In a real implementation, you would call your API to save the settings
    console.log('Saving settings:', {
      name,
      description,
      autoScale,
      maxConcurrency
    });
    
    alert('Settings saved successfully');
    setIsDirty(false);
  };
  
  // Mark form as dirty when changes occur
  const updateField = (setter: React.Dispatch<React.SetStateAction<any>>, value: any) => {
    setter(value);
    setIsDirty(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Bot Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Bot Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => updateField(setName, e.target.value)}
              placeholder="Enter bot name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => updateField(setDescription, e.target.value)}
              placeholder="Describe what this bot does"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Performance Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-scale" className="block mb-1">Auto-scaling</Label>
              <p className="text-sm text-gray-500">Automatically adjust concurrency based on workload</p>
            </div>
            <Switch
              id="auto-scale"
              checked={autoScale}
              onCheckedChange={(checked) => updateField(setAutoScale, checked)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="max-concurrency">Maximum Concurrency</Label>
            <Input
              id="max-concurrency"
              type="number"
              min={1}
              max={100}
              value={maxConcurrency}
              onChange={(e) => updateField(setMaxConcurrency, parseInt(e.target.value))}
              disabled={autoScale}
            />
            <p className="text-xs text-gray-500">Maximum number of concurrent executions</p>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!isDirty}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
} 