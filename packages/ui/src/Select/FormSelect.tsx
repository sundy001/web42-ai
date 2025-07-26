import { Control, Controller, FieldPath, FieldValues } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../form";
import {
  Select as RawSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./RawSelect";

interface SelectOption {
  value: string;
  label: string;
}

interface FormSelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<React.ComponentProps<typeof RawSelect>, "name"> {
  options: SelectOption[];
  placeholder: string;
  name: TName;
  control?: Control<TFieldValues>;
  rules?: Parameters<typeof Controller<TFieldValues, TName>>[0]["rules"];
  label?: string;
  description?: string;
  message?: string;
}

const FormSelect = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  control,
  rules,
  label,
  description,
  message,
  options,
  placeholder,
  ...props
}: FormSelectProps<TFieldValues, TName>) => {
  return (
    <FormField
      control={control}
      name={name}
      rules={rules}
      render={({ field }) => (
        <FormItem>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <RawSelect {...props} {...field}>
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
            </RawSelect>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          {message && <FormMessage>{message}</FormMessage>}
        </FormItem>
      )}
    />
  );
};

export { FormSelect };
export type { FormSelectProps, SelectOption };
