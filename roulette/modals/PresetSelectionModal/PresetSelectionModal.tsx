import type { Component } from "solid-js";
import { For, Show } from "solid-js";
import styles from "./PresetSelectionModal.module.css";
import type { RoulettePreset } from "../../types";

interface PresetSelectionModalProps {
	isOpen: boolean;
	onClose: () => void;
	presets: RoulettePreset[];
	onPresetSelect: (preset: RoulettePreset) => void;
}

const PresetSelectionModal: Component<PresetSelectionModalProps> = (props) => {
	const handleSelect = (preset: RoulettePreset) => {
		props.onPresetSelect(preset);
		props.onClose();
	};

	return (
		<Show when={props.isOpen}>
			<div class={styles.modalOverlay}>
				<div class={styles.modalContent}>
					<h2>Select a Preset</h2>
					<div class={styles.presetList}>
						<For each={props.presets}>
							{(preset) => (
								<button
									type="button"
									class="cs-btn"
									onClick={() => handleSelect(preset)}
									style={{ padding: "12px 10px" }}
								>
									{preset.name}
								</button>
							)}
						</For>
					</div>
					<button
						type="button"
						class="cs-btn"
						onClick={props.onClose}
						style={{ padding: "12px 10px" }}
					>
						Close
					</button>
				</div>
			</div>
		</Show>
	);
};

export default PresetSelectionModal;
