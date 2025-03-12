"use client";

import React, { useState, useRef, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Badge } from './badge';
import { Input } from './input';
import { cn } from '@/lib/utils';

export interface TagInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  badgeClassName?: string;
  inputClassName?: string;
}

export function TagInput({
  value,
  onChange,
  placeholder = 'Add tags...',
  disabled = false,
  className,
  badgeClassName,
  inputClassName,
  ...props
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Convert the comma-separated string to an array of tags
  const tags = value ? value.split(',').map(tag => tag.trim()).filter(Boolean) : [];

  // Add a new tag
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag) return;
    
    // Don't add duplicates
    if (tags.includes(trimmedTag)) return;
    
    const newTags = [...tags, trimmedTag];
    onChange(newTags.join(', '));
    setInputValue('');
  };

  // Remove a tag
  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    onChange(newTags.join(', '));
  };

  // Handle key presses
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Tab' && inputValue) {
      // Add tag on Tab key if there's input
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      // Remove the last tag when backspace is pressed and input is empty
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-wrap gap-2 border border-input rounded-md px-3 py-2 focus-within:ring-1 focus-within:ring-ring",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag, index) => (
        <Badge 
          key={`${tag}-${index}`}
          variant="secondary"
          className={cn("flex items-center gap-1", badgeClassName)}
        >
          {tag}
          {!disabled && (
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
            />
          )}
        </Badge>
      ))}
      <Input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (inputValue) {
            addTag(inputValue);
          }
        }}
        className={cn("border-0 p-0 shadow-none focus-visible:ring-0 flex-grow min-w-[120px]", inputClassName)}
        placeholder={tags.length === 0 ? placeholder : ''}
        disabled={disabled}
        {...props}
      />
    </div>
  );
} 