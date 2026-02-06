import type { Component, Accessor, Setter } from "solid-js";
import styles from "./RouletteControls.module.css";
import CheckboxControl from "./CheckboxControl";
import SpinDurationSliderContainer from "./SpinDurationSliderContainer";

interface RouletteControlsProps {
	// Props for CheckboxControl
	showResultModalToggle: Accessor<boolean>;
	onShowResultModalToggleChange: (checked: boolean) => void;
	filterOutRolledItemsToggle: Accessor<boolean>;
	onFilterOutRolledItemsChange: (checked: boolean) => void;
	// Props for SpinDurationSliderContainer
	enableSpinDurationSlider?: Accessor<boolean | undefined>;
	internalSpinDuration: Accessor<number>;
	setInternalSpinDuration: Setter<number>;
	isSpinning: Accessor<boolean>;
}

const RouletteControls: Component<RouletteControlsProps> = (props) => {
	return (
		<div class={styles.controlsContainer}>
			<CheckboxControl
				id="showResultModalCheckbox"
				labelText="Show result modal"
				isChecked={props.showResultModalToggle}
				onChange={props.onShowResultModalToggleChange}
			/>
			{/* Spin Duration Slider Container */}
			<SpinDurationSliderContainer
				enableSlider={props.enableSpinDurationSlider}
				value={props.internalSpinDuration}
				onChange={props.setInternalSpinDuration}
				disabled={props.isSpinning}
				min={1}
				max={30}
				step={1}
				label="Spin Duration (seconds):"
			/>
			<CheckboxControl
				id="filterOutRolledCheckbox"
				labelText="Filter out rolled items"
				isChecked={props.filterOutRolledItemsToggle}
				onChange={props.onFilterOutRolledItemsChange}
			/>
		</div>
	);
};

export default RouletteControls;
