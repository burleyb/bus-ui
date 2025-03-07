"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SystemSettingsTabProps {
  nodeData: any;
}

export default function SystemSettingsTab({ nodeData }: SystemSettingsTabProps) {
  if (!nodeData) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-500">No data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="system-active">System Active</Label>
            <Switch
              id="system-active"
              checked={nodeData.status === 'ACTIVE'}
              onCheckedChange={() => {
                // TODO: Implement system status toggle
                console.log('Toggle system status');
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* System Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>System Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="system-name">System Name</Label>
            <Input
              id="system-name"
              value={nodeData.name || ''}
              onChange={(e) => {
                // TODO: Implement name change
                console.log('Change system name:', e.target.value);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="system-description">Description</Label>
            <Input
              id="system-description"
              value={nodeData.description || ''}
              onChange={(e) => {
                // TODO: Implement description change
                console.log('Change system description:', e.target.value);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* System Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>System Permissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="system-public">Public Access</Label>
            <Switch
              id="system-public"
              checked={nodeData.isPublic || false}
              onCheckedChange={() => {
                // TODO: Implement public access toggle
                console.log('Toggle public access');
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Changes */}
      <div className="flex justify-end">
        <Button
          onClick={() => {
            // TODO: Implement save changes
            console.log('Save system settings');
          }}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
} 