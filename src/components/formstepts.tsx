interface FormStepsProps {
  labels: string[];
  completedSteps: number;
}
const FormSteps = (props: FormStepsProps) => {
  return (
    <>
      <div className="flex gap-2 items-center justify-between">
        {props.labels.map((label, index) => (
          <div
            key={index}
            className={`flex items-center gap-2 ${
              index < props.labels.length - 1 ? "grow" : ""
            }`}
          >
            <div className="grid place-items-center">
              <div
                className={`h-6 w-6 rounded-full text-sm text-white font-semibold ${
                  props.completedSteps > index ? "bg-blue-500" : "bg-gray-300"
                } grid place-items-center`}
              >
                {props.completedSteps > index ? index + 1 : index + 1}
              </div>
              <p className="text-[0.60rem] mt-1">{label}</p>
            </div>
            {index !== props.labels.length - 1 && (
              <div
                className={`h-[0.2rem] ${
                  props.completedSteps - 1 > index
                    ? "bg-blue-500"
                    : "bg-gray-300"
                } grow mb-4`}
              ></div>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

export { FormSteps };
