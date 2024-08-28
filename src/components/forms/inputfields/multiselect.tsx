import { Label } from "@/components/ui/label";
import { OptionValue } from "@/models/main";
import { Select } from "antd";
import { Controller, FieldValues, Path, useFormContext } from "react-hook-form";

type MultiSelectProps<T extends FieldValues> = {
  name: Path<T>;
  options: OptionValue[];
  title: string;
  placeholder: string;
  required: boolean;
  disable?: boolean;
};

export function MultiSelect<T extends FieldValues>(props: MultiSelectProps<T>) {
  const {
    control,
    formState: { errors },
  } = useFormContext();
  const error = errors[props.name as keyof typeof errors];

  return (
    <Controller
      control={control}
      name={props.name}
      render={({ field }) => (
        <>
          <Label htmlFor={props.name} className="text-sm font-normal">
            {props.title}
            {props.required && <span className="text-rose-500">*</span>}
          </Label>
          <Select
            disabled={props.disable ?? false}
            showSearch
            status={error ? "error" : undefined}
            className="w-full mt-1"
            onChange={(value) => field.onChange(value)}
            options={props.options}
            value={field.value}
            placeholder={props.placeholder}
          />
          {error && (
            <p className="text-xs text-red-500">{error.message?.toString()}</p>
          )}
        </>
      )}
    />
  );
}
