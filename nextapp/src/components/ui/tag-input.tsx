"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface TagInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange?: (value: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
}

export const TagInput = React.forwardRef<HTMLInputElement, TagInputProps>(
  ({ value, onChange, placeholder, className, ...props }, ref) => {
    const [tags, setTags] = React.useState<string[]>([]);
    const [inputValue, setInputValue] = React.useState<string>("");

    // Parse initial tags from comma-separated string
    React.useEffect(() => {
      // Ensure value is a string before calling split
      const safeValue = value ? (typeof value === 'string' ? value : String(value)) : '';
      try {
        const tagArray = safeValue.split(",").filter(tag => tag.trim() !== "");
        setTags(tagArray);
      } catch (error) {
        console.error("Error parsing tags:", error);
        setTags([]);
      }
    }, [value]);

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
    };

    // Add tag when Enter is pressed or comma is typed
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addTag();
      }
    };

    // Add tag from input
    const addTag = () => {
      if (inputValue.trim() !== "") {
        // Handle comma-separated input
        const newTags = inputValue
          .split(",")
          .map(tag => tag.trim())
          .filter(tag => tag !== "");
        
        if (newTags.length > 0) {
          const updatedTags = [...tags, ...newTags];
          setTags(updatedTags);
          
          // Create a synthetic event to pass back to the form controller
          if (onChange) {
            const syntheticEvent = {
              target: {
                name: props.name,
                value: updatedTags.join(","),
              },
            } as React.ChangeEvent<HTMLInputElement>;
            
            onChange(syntheticEvent);
          }
          
          setInputValue("");
        }
      }
    };

    // Remove tag
    const removeTag = (indexToRemove: number) => {
      const updatedTags = tags.filter((_, index) => index !== indexToRemove);
      setTags(updatedTags);
      
      // Create a synthetic event to pass back to the form controller
      if (onChange) {
        const syntheticEvent = {
          target: {
            name: props.name,
            value: updatedTags.join(","),
          },
        } as React.ChangeEvent<HTMLInputElement>;
        
        onChange(syntheticEvent);
      }
    };

    // Handle blur to add any pending tag
    const handleBlur = () => {
      addTag();
    };

    return (
      <div
        className={cn(
          "flex flex-wrap gap-2 p-1 rounded-md border border-input bg-background",
          className
        )}
      >
        {tags.map((tag, index) => (
          <Badge key={`${tag}-${index}`} variant="secondary" className="max-w-[200px]">
            <span className="truncate">{tag}</span>
            <button
              type="button"
              className="ml-1 rounded-full outline-none focus:ring-2 focus:ring-offset-2"
              onClick={() => removeTag(index)}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Input
          ref={ref}
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="border-0 p-0 shadow-none focus-visible:ring-0 flex-1 min-w-[120px]"
          {...props}
        />
      </div>
    );
  }
);

TagInput.displayName = "TagInput"; 