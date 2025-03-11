"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";

interface FormFieldContextValue<
  TFieldValues extends Record<string, any> = Record<string, any>,
  TName extends string = string
> {
  name: TName;
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
);

export const FormField = <
  TFieldValues extends Record<string, any> = Record<string, any>,
  TName extends string = string
>({
  ...props
}: {
  name: TName;
  children: React.ReactNode;
}) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      {props.children}
    </FormFieldContext.Provider>
  );
};

export const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  
  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }
  
  return fieldContext;
};

export function FormItem({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`space-y-2 ${className || ""}`}
      {...props}
    />
  );
}

export function FormLabel({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`text-sm font-medium leading-none ${className || ""}`}
      {...props}
    />
  );
}

export function FormControl({
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} />;
}

export function FormMessage({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  const { name } = useFormField();
  const { formState } = useFormContext();
  const error = name ? formState.errors[name] : null;
  
  const body = error
    ? String(error.message)
    : children;
    
  if (!body) {
    return null;
  }
  
  return (
    <p
      className={`text-sm font-medium text-red-500 ${className || ""}`}
      {...props}
    >
      {body}
    </p>
  );
} 