# React Hook Form Components

This package now includes form-controlled components that integrate with react-hook-form for easy form handling.

## Available Components

### FormInput
A controlled Input component that works with react-hook-form.

```tsx
import { useForm } from "react-hook-form";
import { FormInput } from "@web42-ai/ui/input";

interface FormData {
  name: string;
  email: string;
}

export function MyForm() {
  const { control, handleSubmit } = useForm<FormData>();
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormInput
        name="name"
        control={control}
        rules={{ required: "Name is required" }}
        placeholder="Enter your name"
      />
      <FormInput
        name="email"
        control={control}
        rules={{ 
          required: "Email is required",
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: "Invalid email address"
          }
        }}
        type="email"
        placeholder="Enter your email"
      />
    </form>
  );
}
```

### FormSelect
A controlled Select component with predefined options.

```tsx
import { FormSelect } from "@web42-ai/ui/select";

const options = [
  { value: "google", label: "Google" },
  { value: "github", label: "GitHub" },
  { value: "email", label: "Email" },
];

<FormSelect
  name="authProvider"
  control={control}
  rules={{ required: "Auth provider is required" }}
  options={options}
  placeholder="Select auth provider"
/>
```

### FormCheckbox
A controlled Checkbox component for boolean values.

```tsx
import { FormCheckbox } from "@web42-ai/ui/checkbox";

<FormCheckbox
  name="termsAccepted"
  control={control}
  rules={{ required: "You must accept the terms" }}
/>
```

## Directory Structure

Components are now organized in directories:

```
src/
├── Input/
│   ├── Input.tsx          # Raw input component
│   ├── FormInput.tsx      # Controlled input component
│   └── index.ts           # Exports both components
├── Select/
│   ├── Select.tsx         # Raw select components
│   ├── FormSelect.tsx     # Controlled select component
│   └── index.ts           # Exports all select components
└── Checkbox/
    ├── Checkbox.tsx       # Raw checkbox component
    ├── FormCheckbox.tsx   # Controlled checkbox component
    └── index.ts           # Exports both components
```

## Imports

You can import both raw and form components from the same path:

```tsx
// Raw components
import { Input } from "@web42-ai/ui/input";
import { Select, SelectContent, SelectItem } from "@web42-ai/ui/select";
import { Checkbox } from "@web42-ai/ui/checkbox";

// Form-controlled components
import { FormInput } from "@web42-ai/ui/input";
import { FormSelect } from "@web42-ai/ui/select";
import { FormCheckbox } from "@web42-ai/ui/checkbox";
```