import React from "react";
interface RadioSelectOptionProps<T extends string> {
  value: T;
  children: React.ReactNode;
}

interface RadioSelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  name?: string;
  children: React.ReactElement<RadioSelectOptionProps<T>>[];
}

function RadioSelectOption<T extends string>({ children }: RadioSelectOptionProps<T>) {
  return <>{children}</>;
}

function RadioSelect<T extends string>({ value, onChange, name = 'radio-select', children }: RadioSelectProps<T>) {
  const options = React.Children.toArray(children) as React.ReactElement<RadioSelectOptionProps<T>>[];
  return (
    <div className="flex justify-center">
      <div className="inline-flex">
        {options.map((child, index) => {
          const optionValue = child.props.value;
          const isFirst = index === 0;
          const isLast = index === options.length - 1;
          return (
            <label key={optionValue} className="cursor-pointer">
              <input
                type="radio"
                name={name}
                value={optionValue}
                checked={value === optionValue}
                onChange={() => onChange(optionValue)}
                className="peer absolute h-px w-px overflow-hidden whitespace-nowrap [clip:rect(0_0_0_0)] [clip-path:inset(100%)]"
              />
              <span
                className={`relative -ml-px flex h-10 w-12 cursor-pointer items-center justify-center border-2 first:ml-0 peer-focus-visible:z-10 duration-150 ease-in-out peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-white peer-checked:z-1 peer-checked:border-white peer-checked:bg-white peer-checked:text-black ${
                  isFirst ? 'ml-0 rounded-l-md' : ''
                } ${isLast ? 'rounded-r-md' : ''}`}
              >
                <span className="sr-only">{optionValue}</span>
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