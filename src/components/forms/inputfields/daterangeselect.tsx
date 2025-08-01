import { Controller, FieldValues, Path, useFormContext } from "react-hook-form";

import { DatePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { Label } from "@/components/ui/label";

const { RangePicker } = DatePicker;

type DateRangeSelectProps<T extends FieldValues> = {
  name: Path<T>;
  title: string;
  placeholder?: [string, string];
  required: boolean;
  disable?: boolean;
  mindate?: Dayjs;
  maxdate?: Dayjs;
  format?: string;
};

export function DateRangeSelect<T extends FieldValues>(props: DateRangeSelectProps<T>) {
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
          <RangePicker
            disabled={props.disable ?? false}
            className="w-full"
            value={
              field.value && Array.isArray(field.value) && field.value.length === 2
                ? [
                    field.value[0] && dayjs(field.value[0]).isValid() 
                      ? dayjs(field.value[0]) 
                      : null,
                    field.value[1] && dayjs(field.value[1]).isValid() 
                      ? dayjs(field.value[1]) 
                      : null
                  ]
                : [null, null]
            }
            status={error ? "error" : undefined}
            onChange={(dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
              if (dates && dates[0] && dates[1]) {
                field.onChange([
                  dates[0].toDate().toString(),
                  dates[1].toDate().toString()
                ]);
              } else {
                field.onChange(null);
              }
            }}
            minDate={props.mindate ? props.mindate : undefined}
            maxDate={props.maxdate ? props.maxdate : undefined}
            placeholder={props.placeholder ? props.placeholder : ["Start Date", "End Date"]}
            format={props.format ? props.format : undefined}
          />
          {error && (
            <p className="text-xs text-red-500">{error.message?.toString()}</p>
          )}
        </>
      )}
    />
  );
}
