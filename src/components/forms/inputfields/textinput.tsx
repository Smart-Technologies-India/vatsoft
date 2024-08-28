import { Label } from "@/components/ui/label";
import { Input } from "antd";
import { Controller, FieldValues, Path, useFormContext } from "react-hook-form";

type TaxtInputProps<T extends FieldValues> = {
  name: Path<T>;
  title: string;
  placeholder: string;
  required?: boolean;
  onlynumber?: boolean;
  disable?: boolean;
  maxlength?: number;
  extratax?: string;
};

export function TaxtInput<T extends FieldValues>(props: TaxtInputProps<T>) {
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
          <div className="w-full flex flex-wrap">
            <Label htmlFor={props.name} className="text-sm font-normal">
              {props.title}
              {props.required && <span className="text-rose-500">*</span>}
            </Label>
            {props.extratax && (
              <p className="text-red-500 text-sm">{props.extratax}</p>
            )}
          </div>
          <Input
            showCount={props.maxlength ? true : undefined}
            maxLength={props.maxlength ?? undefined}
            status={error ? "error" : undefined}
            className="w-full mt-1"
            value={field.value}
            disabled={props.disable ?? false}
            onChange={(e) => {
              if (!e) return;
              let { value } = e.target;
              if (props.onlynumber) {
                value = value.replace(/[^0-9]/g, "");
              }
              field.onChange(value);
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
