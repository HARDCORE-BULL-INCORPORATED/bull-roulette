import type { Component, Accessor, Setter } from "solid-js";
import { Show, createSignal } from "solid-js";
import SpinDurationSlider from "./SpinDurationSlider";

interface SpinDurationSliderContainerProps {
	enableSlider?: Accessor<boolean | undefined>;
	value: Accessor<number>; // This will now be the 'committed' value
	onChange: Setter<number>; // This will be called when the slider value is committed
	disabled: Accessor<boolean>;
	min?: number;
	max?: number;
	step?: number;
	label?: string;
}

const SpinDurationSliderContainer: Component<
	SpinDurationSliderContainerProps
> = (props) => {
	const showSlider = () =>
		props.enableSlider === undefined || props.enableSlider();

	// State for custom max value
	const [customMax, setCustomMax] = createSignal(props.max || 30);
	const [showCustomMaxInput, setShowCustomMaxInput] = createSignal(false);
	const [customMaxInput, setCustomMaxInput] = createSignal("");

	const handleSetCustomMax = () => {
		const value = Number(customMaxInput());
		if (value && value > 0 && value <= 1_000_000) {
			setCustomMax(value);
			setShowCustomMaxInput(false);
			setCustomMaxInput("");
		}
	};

	const handleResetToDefault = () => {
		setCustomMax(30);
		setShowCustomMaxInput(false);
		setCustomMaxInput("");
	};

	return (
		<Show when={showSlider()}>
			<div
				style={{
					display: "flex",
					"flex-direction": "column",
					"align-items": "center",
					"margin-bottom": "5px",
				}}
			>
				<div
					style={{
						display: "flex",
						"justify-content": "center",
						"margin-bottom": "5px",
					}}
				>
					<SpinDurationSlider
						initialValue={props.value} // Pass the current committed value as initialValue
						onCommit={props.onChange} // onCommit from slider will call onChange of container (which is the Setter)
						min={props.min || 1}
						max={customMax()}
						step={props.step || 1}
						disabled={props.disabled}
					/>
				</div>

				{/* Custom max controls - only show in development mode */}
				<Show when={import.meta.env.DEV}>
					<div
						style={{
							display: "flex",
							"align-items": "center",
							gap: "8px",
							"font-size": "12px",
						}}
					>
						<Show when={!showCustomMaxInput()}>
							<span>Max: {customMax()}s</span>
							<button
								class="cs-btn"
								type="button"
								onClick={() => setShowCustomMaxInput(true)}
								style={{
									border: "1px solid #666",
									"border-radius": "4px",
									padding: "6px 8px",
									"font-size": "11px",
									cursor: "pointer",
								}}
							>
								Custom Max
							</button>
							<Show when={customMax() !== 30}>
								<button
									class="cs-btn"
									type="button"
									onClick={handleResetToDefault}
									style={{
										border: "1px solid #888",
										"border-radius": "4px",
										padding: "2px 6px",
										"font-size": "11px",
										cursor: "pointer",
									}}
								>
									Reset (30s)
								</button>
							</Show>
						</Show>

						<Show when={showCustomMaxInput()}>
							<input
								type="number"
								placeholder="Max seconds"
								value={customMaxInput()}
								onInput={(e) => setCustomMaxInput(e.currentTarget.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") handleSetCustomMax();
									if (e.key === "Escape") {
										setShowCustomMaxInput(false);
										setCustomMaxInput("");
									}
								}}
								style={{
									width: "80px",
									padding: "2px 4px",
									border: "1px solid #666",
									"border-radius": "4px",
									background: "#333",
									color: "white",
									"font-size": "11px",
								}}
								min="1"
								max="1000"
							/>
							<button
								type="button"
								onClick={handleSetCustomMax}
								style={{
									background: "#4CAF50",
									color: "white",
									border: "1px solid #45a049",
									"border-radius": "4px",
									padding: "2px 6px",
									"font-size": "11px",
									cursor: "pointer",
								}}
							>
								Set
							</button>
							<button
								type="button"
								onClick={() => {
									setShowCustomMaxInput(false);
									setCustomMaxInput("");
								}}
								style={{
									background: "#f44336",
									color: "white",
									border: "1px solid #da190b",
									"border-radius": "4px",
									padding: "2px 6px",
									"font-size": "11px",
									cursor: "pointer",
								}}
							>
								Cancel
							</button>
						</Show>
					</div>
				</Show>
			</div>
		</Show>
	);
};

export default SpinDurationSliderContainer;
