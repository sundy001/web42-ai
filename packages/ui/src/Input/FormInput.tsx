import * as React from "react";
import { Control, Controller, FieldPath, FieldValues } from "react-hook-form";
import { Input } from "./Input";

interface FormInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends Omit<React.ComponentProps<"input">, "name"> {
  name: TName;
  control: Control<TFieldValues>;
  rules?: Parameters<typeof Controller<TFieldValues, TName>>[0]["rules"];
}

const FormInput = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  control,
  rules,
  ...props
}: FormInputProps<TFieldValues, TName>) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field }) => <Input {...field} {...props} />}
    />
  );
};

export { FormInput };
export type { FormInputProps };