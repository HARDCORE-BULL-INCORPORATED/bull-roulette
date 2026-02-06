/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
import type { Component } from "solid-js";
import { For, Show, createEffect, createMemo } from "solid-js";
import { createStore } from "solid-js/store";
import styles from "./MapWeightModal.module.css";
import type { CaseItem } from "../../types";

interface MapWeightModalProps {
	isOpen: boolean;
	onClose: () => void;
	currentMapConfigs: CaseItem[];
	onSave: (updatedMapConfigs: CaseItem[]) => void;
	onWeightChange?: (updatedMapConfigs: CaseItem[]) => void; // New callback for real-time updates
}

const MapWeightModal: Component<MapWeightModalProps> = (props) => {
	const [editableMapConfigs, setEditableMapConfigs] = createStore<CaseItem[]>(
		[],
	);

	// Store for tracking raw input strings
	const [weightInputs, setWeightInputs] = createStore<Record<string, string>>(
		{},
	);

	createEffect(() => {
		if (props.isOpen) {
			setEditableMapConfigs(props.currentMapConfigs.map((map) => ({ ...map })));
			// Initialize weight inputs with current weight values
			const initialInputs: Record<string, string> = {};
			for (const map of props.currentMapConfigs) {
				initialInputs[map.name] = map.weight.toString();
			}
			setWeightInputs(initialInputs);
		}
	});

	const totalWeight = createMemo(() => {
		return editableMapConfigs.reduce((sum, map) => sum + (map.weight || 0), 0);
	});

	const handleWeightChange = (mapName: string, newWeight: string) => {
		// Always update the input string immediately
		setWeightInputs(mapName, newWeight);
	};

	const handleWeightBlur = (mapName: string, inputValue: string) => {
		// Parse and validate the weight when input loses focus
		if (inputValue === "") {
			setEditableMapConfigs((map) => map.name === mapName, "weight", 0);
		} else {
			// Replace comma with dot for parsing
			const normalizedWeight = inputValue.replace(",", ".");
			const weightValue = Number.parseFloat(normalizedWeight);

			// Update the numeric value if it's valid, otherwise keep the previous value
			if (!Number.isNaN(weightValue) && weightValue >= 0) {
				setEditableMapConfigs(
					(map) => map.name === mapName,
					"weight",
					weightValue,
				);
			} else {
				// Reset input to the current weight if invalid
				const currentMap = editableMapConfigs.find(
					(map) => map.name === mapName,
				);
				if (currentMap) {
					setWeightInputs(mapName, currentMap.weight.toString());
				}
			}
		}

		// Call the callback if provided
		if (props.onWeightChange) {
			const normalizedWeight = inputValue.replace(",", ".");
			const parsedWeight = Number.parseFloat(normalizedWeight);
			const validWeight =
				!Number.isNaN(parsedWeight) && parsedWeight >= 0 ? parsedWeight : 0;

			const updatedConfigs = editableMapConfigs.map((map) =>
				map.name === mapName
					? {
							...map,
							weight: inputValue === "" ? 0 : validWeight,
						}
					: { ...map },
			);
			props.onWeightChange(updatedConfigs);
		}
	};

	const handleUpdateProbabilities = () => {
		// Process all current input values and update the numeric weights
		for (const map of editableMapConfigs) {
			const inputValue = weightInputs[map.name] || map.weight.toString();
			if (inputValue === "") {
				setEditableMapConfigs((m) => m.name === map.name, "weight", 0);
			} else {
				const normalizedWeight = inputValue.replace(",", ".");
				const weightValue = Number.parseFloat(normalizedWeight);

				if (!Number.isNaN(weightValue) && weightValue >= 0) {
					setEditableMapConfigs(
						(m) => m.name === map.name,
						"weight",
						weightValue,
					);
				} else {
					// Reset invalid inputs to current weight
					setWeightInputs(map.name, map.weight.toString());
				}
			}
		}

		// Call the callback if provided
		if (props.onWeightChange) {
			const updatedConfigs = editableMapConfigs.map((map) => {
				const inputValue = weightInputs[map.name] || map.weight.toString();
				const normalizedWeight = inputValue.replace(",", ".");
				const parsedWeight = Number.parseFloat(normalizedWeight);
				const validWeight =
					!Number.isNaN(parsedWeight) && parsedWeight >= 0
						? parsedWeight
						: map.weight;

				return {
					...map,
					weight: inputValue === "" ? 0 : validWeight,
				};
			});
			props.onWeightChange(updatedConfigs);
		}
	};

	const handleSave = () => {
		const configsWithEnsuredWeights = editableMapConfigs.map((map) => ({
			...map,
			weight:
				typeof map.weight !== "number" ||
				Number.isNaN(map.weight) ||
				map.weight < 0
					? 1
					: map.weight,
		}));
		props.onSave(configsWithEnsuredWeights);
		props.onClose();
	};

	const handleBackdropClick = (e: MouseEvent) => {
		if (e.target === e.currentTarget) {
			props.onClose();
		}
	};

	return (
		<Show when={props.isOpen}>
			<div
				class={styles.modalBackdrop}
				onClick={handleBackdropClick}
				role="presentation"
			>
				<dialog
					class={styles.modalContent}
					aria-modal="true"
					aria-labelledby="weightModalTitle"
					// biome-ignore lint/suspicious/noExplicitAny: <explanation>
					{...({ closedby: "none" } as any)}
				>
					<div class={styles.modalHeader}>
						<h2 id="weightModalTitle" class={styles.modalTitle}>
							Customize Map Weights
						</h2>
						<button
							type="button"
							class={styles.closeButton}
							onClick={props.onClose}
							aria-label="Close"
						>
							×
						</button>
					</div>

					<p class={styles.explanationText}>
						Adjust the weights to change the likelihood of each map being
						selected. A higher weight means a higher chance. For example, a map
						with weight 2 is twice as likely to be picked as a map with weight
						1. Weights are relative to each other.
					</p>

					<p
						class={styles.warningText || styles.explanationText}
						style={{
							color: "#f39c12",
							"font-size": "14px",
							"margin-top": "10px",
							"font-style": "italic",
						}}
					>
						⚠️ Note: Updating the map pool (adding/removing maps) will reset all
						weights to 1 for now.
					</p>

					<div class={styles.mapRowsContainer}>
						<For each={(() => {
							const rows: CaseItem[][] = [];
							const itemsPerRow = 7;
							
							for (let i = 0; i < editableMapConfigs.length; i += itemsPerRow) {
								rows.push(editableMapConfigs.slice(i, i + itemsPerRow));
							}
							
							return rows;
						})()}>
							{(row) => (
								<ul class={styles.mapListRow}>
									<For each={row}>
										{(map) => {
											const probability = createMemo(() => {
												const currentTotalWeight = totalWeight();
												return currentTotalWeight > 0
													? ((map.weight || 0) / currentTotalWeight) * 100
													: 0;
											});

											return (
												<li class={styles.mapWeightItem}>
													<img
														src={map.image}
														alt={map.name}
														class={styles.mapImage}
													/>
													<span class={styles.mapName}>{map.name}</span>
													<input
														type="text"
														value={weightInputs[map.name] || map.weight.toString()}
														onInput={(e) =>
															handleWeightChange(map.name, e.currentTarget.value)
														}
														onBlur={(e) =>
															handleWeightBlur(map.name, e.currentTarget.value)
														}
														class={styles.weightInput}
														placeholder="0"
													/>
													<span class={styles.mapProbability}>
														({probability().toFixed(1)}%)
													</span>
												</li>
											);
										}}
									</For>
								</ul>
							)}
						</For>
					</div>

					<div
						style={{
							"text-align": "center",
							margin: "20px 0",
						}}
					>
						<button
							type="button"
							class={styles.actionButton}
							onClick={handleUpdateProbabilities}
						>
							Update Probabilities
						</button>
					</div>

					<div class={styles.modalActions}>
						<button
							type="button"
							class={styles.actionButton}
							onClick={props.onClose}
						>
							Cancel
						</button>
						<button
							type="button"
							class={`${styles.actionButton} ${styles.saveButton}`}
							onClick={handleSave}
						>
							Exit
						</button>
					</div>
				</dialog>
			</div>
		</Show>
	);
};

export default MapWeightModal;
