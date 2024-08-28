import { Controller, FieldValues, Path, useFormContext } from "react-hook-form";

import { DatePicker } from "antd";
import dayjs from "dayjs";
import { Label } from "@/components/ui/label";

type DateSelectProps<T extends FieldValues> = {
  name: Path<T>;
  title: string;
  placeholder: string;
  required: boolean;
  disable?: boolean;
};

export function DateSelect<T extends FieldValues>(props: DateSelectProps<T>) {
  const {
    control,
    formState: { errors },
  } = useFormContext();
  // Get the error for this specific field
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
          <DatePicker
            disabled={props.disable ?? false}
            className="w-full mt-1"
            value={field.value ? dayjs(field.value) : null}
            status={error ? "error" : undefined}
            onChange={(value: dayjs.Dayjs) => {
              field.onChange(value ? value.toDate().toISOString() : null);
            }}
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