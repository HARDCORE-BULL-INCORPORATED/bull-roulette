import type { Component, Accessor } from "solid-js";
import styles from "./SpinButton.module.css";

interface SpinButtonProps {
	onClick: () => void;
	isSpinning: Accessor<boolean>;
	isDisabled: Accessor<boolean>; // Combined disabled state from parent
	buttonText?: string; // Optional: if you want to customize "Spin" / "Spinning..."
}

const SpinButton: Component<SpinButtonProps> = (props) => {
	const text = () =>
		props.buttonText
			? props.isSpinning()
				? `${props.buttonText}ning...`
				: props.buttonText
			: props.isSpinning()
				? "Spinning..."
				: "Spin";

	return (
		<button
			type="button"
			class={`cs-btn ${styles.spinButton}`} // Combine global cs-btn with local module styles
			onClick={props.onClick}
			disabled={props.isDisabled()}
		>
			{text()}
		</button>
	);
};

export default SpinButton;
