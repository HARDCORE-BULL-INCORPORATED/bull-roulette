import type { Component, Accessor, Setter } from "solid-js";
import { Show } from "solid-js";
import SpinDurationSlider from "./SpinDurationSlider";

interface SpinDurationSliderContainerProps {
	enableSlider?: Accessor<boolean | undefined>; // Made optional and allow direct boolean
	value: Accessor<number>;
	onChange: Setter<number>;
	disabled: Accessor<boolean>;
	min?: number;
	max?: number;
	step?: number;
	label?: string;
}

const SpinDurationSliderContainer: Component<
	SpinDurationSliderContainerProps
> = (props) => {
	// Default to true if enableSlider is not provided, to maintain previous behavior of Show
	const showSlider = () =>
		props.enableSlider === undefined || props.enableSlider();

	return (
		<Show when={showSlider()}>
			<div
				style={{
					display: "flex",
					"justify-content": "center",
					"margin-bottom": "5px",
				}}
			>
				<SpinDurationSlider
					label={props.label || "Spin Duration (seconds):"}
					value={props.value}
					onChange={props.onChange}
					min={props.min || 1}
					max={props.max || 30}
					step={props.step || 1}
					disabled={props.disabled}
				/>
			</div>
		</Show>
	);
};

export default SpinDurationSliderContainer;
