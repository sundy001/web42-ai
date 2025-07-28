import type { JSX } from "react";
import type {
  ControllerProps,
  ControllerRenderProps,
  FieldPath,
  FieldValues,
} from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";

// prevent the component props override the form item props
type OmitFormItemProps<TComponentProps> = Omit<
  TComponentProps,
  | "name"
  | "control"
  | "rules"
  | "shouldUnregister"
  | "disabled"
  | "defaultValue"
  | "id"
  | "label"
  | "description"
  | "message"
  | "render"
  | "value"
>;

type ControlledFormItemProps<
  TComponentProps,
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = OmitFormItemProps<TComponentProps> &
  Pick<
    ControllerProps<TFieldValues, TName>,
    | "name"
    | "control"
    | "rules"
    | "shouldUnregister"
    | "disabled"
    | "defaultValue"
  > & {
    // properties from shadcn/ui FormItem
    id?: string;
    label?: string;
    description?: string;
    message?: string;

    render: (params: {
      field: ControllerRenderProps<TFieldValues, TName>;
      props: OmitFormItemProps<TComponentProps>;
    }) => JSX.Element;
  };

type FormItemProps<
  TComponentProps,
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = Omit<
  ControlledFormItemProps<TComponentProps, TFieldValues, TName>,
  "render"
>;

const ControlledFormItem = <
  TComponent,
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  control,
  rules,
  shouldUnregister,
  disabled,
  defaultValue,
  label,
  description,
  message,
  id,
  render,
  ...props
}: ControlledFormItemProps<TComponent, TFieldValues, TName>) => {
  return (
    <FormField
      control={control}
      name={name}
      rules={rules}
      shouldUnregister={shouldUnregister}
      disabled={disabled}
      defaultValue={defaultValue}
      render={({ field }) => (
        <FormItem id={id}>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            {render({
              props,
              field,
            })}
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          {message && <FormMessage>{message}</FormMessage>}
        </FormItem>
      )}
    />
  );
};

export { ControlledFormItem };
export type { ControlledFormItemProps, FormItemProps };
