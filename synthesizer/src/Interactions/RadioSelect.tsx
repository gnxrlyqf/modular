import React from "react";
interface RadioSelectOptionProps<T> {
  value: T;
  label?: string;
  children: React.ReactNode;
}

interface RadioSelectProps<T> {
  value: T;
  onChange: (value: T) => void;
  name?: string;
  children: React.ReactElement<RadioSelectOptionProps<T>>[];
}

function RadioSelectOption<T>({ children }: RadioSelectOptionProps<T>) {
  return <>{children}</>;
}

function RadioSelect<T>({ value, onChange, name = 'radio-select', children }: RadioSelectProps<T>) {
  const options = React.Children.toArray(children) as React.ReactElement<RadioSelectOptionProps<T>>[];
  return (
    <div className="flex justify-center">
      <div className="inline-flex">
        {options.map((child, index) => {
          const optionValue = child.props.value;
          const optionLabel =
            child.props.label ??
            (typeof child.props.children === "string" || typeof child.props.children === "number"
              ? String(child.props.children)
              : String(optionValue));
          const isFirst = index === 0;
          const isLast = index === options.length - 1;
          return (
            <label key={index} className="cursor-pointer">
              <input
                type="radio"
                name={name}
                checked={Object.is(value, optionValue)}
                onChange={() => onChange(optionValue)}
                className="peer absolute h-px w-px overflow-hidden whitespace-nowrap [clip:rect(0_0_0_0)] [clip-path:inset(100%)]"
              />
              <span
                className={`relative -ml-px flex h-10 w-12 cursor-pointer items-center justify-center border-2 first:ml-0 peer-focus-visible:z-10 duration-150 ease-in-out peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-white peer-checked:z-1 peer-checked:border-white peer-checked:bg-white peer-checked:text-black ${
                  isFirst ? 'ml-0 rounded-l-md' : ''
                } ${isLast ? 'rounded-r-md' : ''}`}
              >
                <span className="sr-only">{optionLabel}</span>
                {child.props.children}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

// Export generic RadioSelect and RadioSelectOption
export { RadioSelect, RadioSelectOption };