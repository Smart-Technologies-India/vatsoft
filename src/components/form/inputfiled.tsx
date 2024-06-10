import { ChangeEvent, RefObject, useState } from "react";
import { Input } from "../ui/input";
import { handleDecimalChange, handleNumberChange } from "@/utils/methods";
import { Textarea } from "../ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { IcBaselineCalendarMonth } from "../icons";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";
import { default as MulSelect } from "react-select";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Control } from "react-hook-form";

// interface InputFieldProps {
//   title: string;
//   name: string;
//   placeholder: string;
//   isDisabled?: boolean;
//   isOnlyNumber?: boolean;
//   isOnlyFloat?: boolean;
//   control: Control<any>;
//   defaultValue?: string;
// }

// const InputField = (props: InputFieldProps) => {
//   const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
//     if (props.isOnlyNumber) {
//       handleNumberChange(event);
//     } else if (props.isOnlyFloat) {
//       handleDecimalChange(event);
//     }
//   };

//   return (
//     <FormField
//       control={props.control}
//       name={props.name}
//       render={({ field }) => {
//         return (
//           <FormItem>
//             <FormLabel className="text-sm font-normal text-black">
//               {props.title}
//             </FormLabel>
//             <FormControl
//               style={{
//                 margin: "2px",
//               }}
//             >
//               <Input
//                 {...field}
//                 defaultValue={props.defaultValue}
//                 type="text"
//                 name={props.name}
//                 disabled={props.isDisabled ?? false}
//                 className="px-2 py-1  focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm m-0"
//                 placeholder={props.placeholder}
//                 onChange={handleChange}
//               />
//             </FormControl>
//             <FormMessage
//               className="text-xs"
//               style={{ margin: 0 }}
//             ></FormMessage>
//           </FormItem>
//         );
//       }}
//     ></FormField>
//   );
// };

// export { InputField };

interface TextAreaFieldProps {
  title: string;
  name: string;
  placeholder: string;
  isDisabled?: boolean;
  isOnlyNumber?: boolean;
  isOnlyFloat?: boolean;
  control: Control<any>;
}

const TextAreaField = (props: TextAreaFieldProps) => {
  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    if (props.isOnlyNumber) {
      handleNumberChange(event);
    } else if (props.isOnlyFloat) {
      handleDecimalChange(event);
    }
  };

  return (
    <FormField
      control={props.control}
      name={props.name}
      render={({ field }) => {
        return (
          <FormItem>
            <FormLabel className="text-sm font-normal text-black">
              {props.title}
            </FormLabel>
            <FormControl
              style={{
                margin: "2px",
              }}
            >
              <Textarea
                {...field}
                name={props.name}
                disabled={props.isDisabled ?? false}
                className="px-2 py-1 focus-visible:ring-transparent h-8 placeholder:text-xs rounded-sm resize-none"
                placeholder={props.placeholder}
                onChange={handleChange}
              />
            </FormControl>
            <FormMessage
              className="text-xs"
              style={{ margin: 0 }}
            ></FormMessage>
          </FormItem>
        );
      }}
    ></FormField>
  );
};

export { TextAreaField };

interface DateFieldProps {
  title: string;
  placeholder: string;
  date: Date | undefined;
  setDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
  isDisabled?: boolean;
}

const DateField = (props: DateFieldProps) => {
  const [pop, setPop] = useState<boolean>(false);

  return (
    <>
      <p className="text-sm mt-2">{props.title}</p>
      <Popover open={pop} onOpenChange={setPop}>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={`w-full mt-1 justify-start text-left font-normal rounded-sm h-8 text-xs ${
              !props.date ?? "text-muted-foreground"
            }`}
          >
            <IcBaselineCalendarMonth className="mr-2 h-4 w-4" />
            {props.date ? (
              format(props.date, "PPP")
            ) : (
              <span>{props.placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={props.date}
            onSelect={(e: Date | undefined) => {
              if (!e) return;
              if (!props.setDate) return;
              props.setDate(e);
              setPop(false);
            }}
            initialFocus
            disabled={props.isDisabled ?? false}
            //   disabled={(date) => date < new Date() || endDate! <= date}
          />
        </PopoverContent>
      </Popover>
    </>
  );
};

export { DateField };

interface SelectFieldOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  title: string;
  setData: React.Dispatch<React.SetStateAction<string>>;
  options: SelectFieldOption[];
  isDisabled?: boolean;
}

const SelectField = (props: SelectFieldProps) => {
  return (
    <>
      <p className="text-sm mt-2 ">{props.title}</p>
      <MulSelect
        isMulti={false}
        options={props.options}
        className="w-full accent-slate-900 rounded-2xl mt-1 h-8 "
        onChange={(val: any) => {
          if (!val) return;
          props.setData(val.value);
        }}
        isDisabled={props.isDisabled ?? false}
      />
    </>
  );
};

export { SelectField };

// <SelectField
// title="Themes"
// setData={setTheme}
// options={[
//   {
//     value: "light",
//     label: "Light",
//   },
//   {
//     value: "dark",
//     label: "Dark",
//   },
//   {
//     value: "system",
//     label: "System",
//   },
// ]}
// ></SelectField>

interface RadioFieldProps<T extends string> {
  title: string;
  setData: React.Dispatch<React.SetStateAction<T>>;
  data: string;
  isDisabled?: boolean;
  enumData: { value: T; label: string }[];
}

const RadioField = <T extends string>(props: RadioFieldProps<T>) => {
  return (
    <>
      <p className="text-sm mt-2">Gender</p>
      <RadioGroup
        defaultValue="exempt"
        className="flex gap-2 mt-3"
        id="exempt"
        value={props.data}
      >
        {props.enumData.map((data, index) => (
          <div key={index} className="flex items-center space-x-2">
            <RadioGroupItem
              value={data.value}
              id={data.value}
              onClick={() => props.setData(data.value)}
            />
            <Label
              htmlFor={data.value}
              className="cursor-pointer"
              onClick={() => props.setData(data.value)}
            >
              {data.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </>
  );
};

export { RadioField };

interface CheckBoxFieldProps {
  title: string;
  options: { id: string; label: string }[];
  setData: React.Dispatch<React.SetStateAction<string[]>>;
  isDisabled?: boolean;
}

const CheckBoxField = (props: CheckBoxFieldProps) => {
  return (
    <>
      <p className="text-sm mt-2">{props.title}</p>
      <div className="flex gap-2 items-center mt-1">
        {props.options.map((option, index) => (
          <div key={index} className="flex gap-1 items-center">
            <Input
              type="checkbox"
              id={option.id}
              disabled={props.isDisabled ?? false}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                if (!e.target.checked) {
                  props.setData((prev) => prev.filter((i) => i !== option.id));
                } else {
                  props.setData((prev) => [...prev, option.id]);
                }
              }}
              className="h-4 w-4"
            />
            <Label
              htmlFor={option.id}
              className="text-center text-xs font-medium"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </div>
    </>
  );
};

export { CheckBoxField };
