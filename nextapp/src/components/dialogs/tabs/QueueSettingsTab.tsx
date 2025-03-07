"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface QueueSettingsTabProps {
  nodeData: any;
}

export default function QueueSettingsTab({ nodeData }: QueueSettingsTabProps) {
  if (!nodeData) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-500">No data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Queue Status */}
      <Card>
        <CardHeader>
          <CardTitle>Queue Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="queue-active">Queue Active</Label>
            <Switch
              id="queue-active"
              checked={nodeData.status === 'ACTIVE'}
              onCheckedChange={() => {
                // TODO: Implement queue status toggle
                console.log('Toggle queue status');
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Queue Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Queue Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="queue-name">Queue Name</Label>
            <Input
              id="queue-name"
              value={nodeData.name || ''}
              onChange={(e) => {
                // TODO: Implement name change
                console.log('Change queue name:', e.target.value);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="queue-description">Description</Label>
            <Textarea
              id="queue-description"
              value={nodeData.description || ''}
              onChange={(e) => {
                // TODO: Implement description change
                console.log('Change queue description:', e.target.value);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="queue-type">Queue Type</Label>
            <Select
              value={nodeData.queueType || 'standard'}
              onValueChange={(value) => {
                // TODO: Implement queue type change
                console.log('Change queue type:', value);
              }}
            >
              <SelectTrigger id="queue-type">
                <SelectValue placeholder="Select queue type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard Queue</SelectItem>
                <SelectItem value="fifo">FIFO Queue</SelectItem>
                <SelectItem value="priority">Priority Queue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Queue Properties */}
      <Card>
        <CardHeader>
          <CardTitle>Queue Properties</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message-retention">Message Retention Period (hours)</Label>
            <Input
              id="message-retention"
              type="number"
              min="1"
              max="336" // 14 days
              value={nodeData.messageRetentionPeriod || 24}
              onChange={(e) => {
                // TODO: Implement retention period change
                console.log('Change retention period:', e.target.value);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visibility-timeout">Visibility Timeout (seconds)</Label>
            <Input
              id="visibility-timeout"
              type="number"
              min="0"
              max="43200" // 12 hours
              value={nodeData.visibilityTimeout || 30}
              onChange={(e) => {
                // TODO: Implement visibility timeout change
                console.log('Change visibility timeout:', e.target.value);
              }}
            />
          </div>

          {nodeData.queueType === 'fifo' && (
            <div className="flex items-center justify-between">
              <Label htmlFor="content-deduplication">Content-based Deduplication</Label>
              <Switch
                id="content-deduplication"
                checked={nodeData.contentBasedDeduplication || false}
                onCheckedChange={() => {
                  // TODO: Implement deduplication toggle
                  console.log('Toggle content-based deduplication');
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Access Control */}
      <Card>
        <CardHeader>
          <CardTitle>Access Control</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="queue-public">Public Access</Label>
            <Switch
              id="queue-public"
              checked={nodeData.isPublic || false}
              onCheckedChange={() => {
                // TODO: Implement public access toggle
                console.log('Toggle public access');
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="encryption">Server-Side Encryption</Label>
            <Switch
              id="encryption"
              checked={nodeData.encryption || false}
              onCheckedChange={() => {
                // TODO: Implement encryption toggle
                console.log('Toggle encryption');
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
            console.log('Save queue settings');
          }}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
} 