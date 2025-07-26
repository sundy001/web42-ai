import * as React from "react";
import { Control, Controller, FieldPath, FieldValues } from "react-hook-form";
import { Checkbox } from "./Checkbox";

interface FormCheckboxProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends Omit<React.ComponentPropsWithoutRef<typeof Checkbox>, "name" | "checked" | "onCheckedChange"> {
  name: TName;
  control: Control<TFieldValues>;
  rules?: Parameters<typeof Controller<TFieldValues, TName>>[0]["rules"];
}

const FormCheckbox = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  control,
  rules,
  ...props
}: FormCheckboxProps<TFieldValues, TName>) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field }) => (
        <Checkbox
          checked={field.value}
          onCheckedChange={field.onChange}
          {...props}
        />
      )}
    />
  );
};

export { FormCheckbox };
export type { FormCheckboxProps };