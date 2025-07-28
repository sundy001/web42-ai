import type { ComponentProps } from "react";
import { type FieldPath, type FieldValues } from "react-hook-form";
import { ControlledFormItem, FormItemProps } from "../ControlledFormItem";
import { Input } from "./Input";

type InputProps = ComponentProps<typeof Input>;

type FormInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = FormItemProps<InputProps, TFieldValues, TName>;

const FormInput = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: FormInputProps<TFieldValues, TName>) => {
  return (
    <ControlledFormItem<InputProps, TFieldValues, TName>
      {...props}
      render={({ field, props }) => (
        <Input
          {...props}
          {...field}
          onChange={(e) => {
            field.onChange(e);
            props.onChange?.(e);
          }}
          onBlur={(e) => {
            field.onBlur();
            props.onBlur?.(e);
          }}
        />
      )}
    />
  );
};

export { FormInput };
export type { FormInputProps };
