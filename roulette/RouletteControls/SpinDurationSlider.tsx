import type { Component } from "solid-js";
import { createSignal, createEffect } from "solid-js";

interface SpinDurationSliderProps {
	initialValue: () => number;
	onCommit: (value: number) => void;
	disabled?: () => boolean;
	min: number;
	max: number;
	step: number;
}

const SpinDurationSlider: Component<SpinDurationSliderProps> = (props) => {
	const label = "Roll Duration";

	const [liveValue, setLiveValue] = createSignal(props.initialValue());

	createEffect(() => {
		setLiveValue(props.initialValue());
	});

	const handleInput = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		setLiveValue(Number(target.value));
	};

	const handleChange = (e: Event) => {
		const target = e.currentTarget as HTMLInputElement;
		const committedVal = Number(target.value);
		setLiveValue(committedVal); // Sync live value
		props.onCommit(committedVal);
	};

	return (
		<div class="cs-slider">
			<div class="value">
				{/* <p class="">{props.min}s</p> */}
				<p class="">{liveValue().toFixed(1)}s</p>
			</div>
			<div class="ruler" />
			<input
				id="range"
				type="range"
				min={props.min}
				max={props.max}
				step={props.step}
				value={liveValue()}
				onInput={handleInput}
				onChange={handleChange}
				disabled={props.disabled ? props.disabled() : false}
			/>
			<label for="range">{label}</label>
		</div>
	);
};

export default SpinDurationSlider;
