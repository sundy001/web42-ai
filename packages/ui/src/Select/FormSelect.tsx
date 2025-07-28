import { ComponentProps } from "react";
import { FieldPath, FieldValues } from "react-hook-form";
import { ControlledFormItem, FormItemProps } from "../ControlledFormItem";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";

interface SelectOption {
  value: string;
  label: string;
}

type SelectProps = Omit<ComponentProps<typeof Select>, "onValueChange"> & {
  options: SelectOption[];
  placeholder?: string;
  onChange?: (value: string) => void;
};

type FormSelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = FormItemProps<SelectProps, TFieldValues, TName> & {
  options: SelectOption[];
};

const FormSelect = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: FormSelectProps<TFieldValues, TName>) => {
  return (
    <ControlledFormItem<SelectProps, TFieldValues, TName>
      {...props}
      render={({ field, props }) => {
        const { placeholder, options, ...rest } = props;
        return (
          <Select
            {...rest}
            {...field}
            onValueChange={(value) => {
              field.onChange(value);
              props.onChange?.(value);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }}
    />
  );
};

export { FormSelect };
export type { FormSelectProps, SelectOption };
