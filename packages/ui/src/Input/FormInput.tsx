import { Control, Controller, FieldPath, FieldValues } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../form";
import { Input } from "./RawInput";

interface FormInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<React.ComponentProps<"input">, "name"> {
  name: TName;
  control?: Control<TFieldValues>;
  rules?: Parameters<typeof Controller<TFieldValues, TName>>[0]["rules"];
  label?: string;
  description?: string;
  message?: string;
}

const FormInput = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  control,
  rules,
  label,
  description,
  message,
  ...props
}: FormInputProps<TFieldValues, TName>) => {
  return (
    <FormField
      control={control}
      name={name}
      rules={rules}
      render={({ field }) => (
        <FormItem>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <Input {...props} {...field} />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          {message && <FormMessage>{message}</FormMessage>}
        </FormItem>
      )}
    />
  );
};

export { FormInput };
export type { FormInputProps };
