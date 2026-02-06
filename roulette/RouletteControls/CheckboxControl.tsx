import type { Component } from "solid-js";

interface CheckboxControlProps {
	id: string;
	labelText: string;
	isChecked: () => boolean;
	onChange: (checked: boolean) => void;
	customClass?: string;
}

const CheckboxControl: Component<CheckboxControlProps> = (props) => {
	return (
		<div class={`cs-checkbox ${props.customClass || ""}`}>
			<input
				id={props.id}
				type="checkbox"
				checked={props.isChecked()}
				onInput={(e) => props.onChange(e.currentTarget.checked)}
			/>
			<label class="cs-checkbox__label" for={props.id}>
				{props.labelText}
			</label>
		</div>
	);
};

export default CheckboxControl;
