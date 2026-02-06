import type { Component } from "solid-js";

interface SpinDurationSliderProps {
	value: () => number;
	onChange: (value: number) => void;
	disabled?: () => boolean;
	min?: number;
	max?: number;
	step?: number;
	label?: string;
}

const SpinDurationSlider: Component<SpinDurationSliderProps> = (props) => {
	const {
		value,
		onChange,
		disabled,
		min = 1,
		max = 60,
		step = 0.5,
		label = "Roll Duration",
	} = props;

	return (
		<div class="cs-slider">
			<div class="value">
				<p class="">{value().toFixed(1)}s</p>
			</div>
			<div class="ruler" />
			<input
				id="range"
				type="range"
				min={min}
				max={max}
				step={step}
				value={value()}
				onInput={(e) => onChange(Number(e.currentTarget.value))}
				disabled={disabled ? disabled() : false}
			/>
			<label for="range">{label}</label>
		</div>
	);
};

export default SpinDurationSlider;
