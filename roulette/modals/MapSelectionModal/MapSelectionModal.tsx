import type { Component } from "solid-js";
import { createSignal, For, Show, createEffect } from "solid-js";
import styles from "./MapSelectionModal.module.css";
import type { CaseItem } from "../../types";

interface MapSelectionModalProps {
	isOpen: boolean;
	onClose: () => void;
	allMaps: CaseItem[];
	activeMapIds: string[];
	onSave: (selectedMapNames: string[]) => void;
	onSelectionChange?: (selectedMapNames: string[]) => void; // New callback for real-time updates
}

const MapSelectionModal: Component<MapSelectionModalProps> = (props) => {
	const [selectedNames, setSelectedNames] = createSignal<string[]>([]); // Changed from selectedIds

	// Initialize selectedNames when the modal opens or activeMapIds change
	createEffect(() => {
		if (props.isOpen) {
			setSelectedNames([...props.activeMapIds]); // Now expects string[]
		}
	});

	const handleCheckboxChange = (mapName: string, checked: boolean) => {
		// Changed mapId to mapName
		const newSelection = checked
			? [...selectedNames(), mapName]
			: selectedNames().filter((name) => name !== mapName);

		setSelectedNames(newSelection);

		// Call the real-time callback if provided
		props.onSelectionChange?.(newSelection);
	};

	const handleSave = () => {
		props.onSave(selectedNames()); // Passes string[]
		props.onClose();
	};

	const handleBackdropClick = (e: MouseEvent) => {
		if (e.target === e.currentTarget) {
			props.onClose();
		}
	};

	const handleSelectAll = () => {
		const allMapNames = props.allMaps.map((map) => map.name); // Changed to map.name
		setSelectedNames(allMapNames);
		// Call the real-time callback if provided
		props.onSelectionChange?.(allMapNames);
	};

	const handleDeselectAll = () => {
		setSelectedNames([]);
		// Call the real-time callback if provided
		props.onSelectionChange?.([]);
	};

	// Dynamic row generation - creates rows of 7 items each
	const mapRows = () => {
		const rows: CaseItem[][] = [];
		const itemsPerRow = 7;
		
		for (let i = 0; i < props.allMaps.length; i += itemsPerRow) {
			rows.push(props.allMaps.slice(i, i + itemsPerRow));
		}
		
		return rows;
	};

	return (
		<Show when={props.isOpen}>
			{/** biome-ignore lint/a11y/noStaticElementInteractions: <explanation> */}
			<div
				class={styles.modalBackdrop}
				onClick={handleBackdropClick}
				onKeyUp={(e) => {
					if (
						e.target === e.currentTarget &&
						(e.key === "Enter" || e.key === " ")
					) {
						props.onClose();
					}
				}}
				role="presentation"
			>
				<dialog
					class={styles.modalContent}
					aria-modal="true"
					aria-labelledby="modalTitle"
					// biome-ignore lint/suspicious/noExplicitAny: <explanation>
					{...({ closedby: "none" } as any)}
				>
					<div class={styles.modalHeader}>
						<h2 id="modalTitle" class={styles.modalTitle}>
							Select Map Pool
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

					<p
						class={styles.warningText || styles.explanationText}
						style={{
							color: "#f39c12",
							"font-size": "14px",
							margin: "15px 20px",
							"font-style": "italic",
							"text-align": "center",
						}}
					>
						⚠️ Note: Changing the map selection will reset all custom map weights
						to 1.
					</p>

					<div class={styles.mapRowsContainer}>
						<For each={mapRows()}>
							{(row) => (
								<ul class={styles.mapListRow}>
									<For each={row}>
										{(map) => (
											<li class={styles.mapItem}>
												<label>
													<input
														type="checkbox"
														checked={selectedNames().includes(map.name)} // Changed to map.name
														onChange={
															(e) =>
																handleCheckboxChange(
																	map.name,
																	e.currentTarget.checked,
																) // Changed to map.name
														}
													/>
													<img
														src={map.image}
														alt={map.name}
														class={styles.mapItemImage}
													/>
													<span class={styles.mapItemName}>{map.name}</span>
												</label>
											</li>
										)}
									</For>
								</ul>
							)}
						</For>
					</div>

					<div class={styles.modalActions}>
						<button
							type="button"
							class={`${styles.actionButton} ${styles.secondaryButton}`}
							onClick={handleDeselectAll}
						>
							Deselect All
						</button>
						<button
							type="button"
							class={`${styles.actionButton} ${styles.secondaryButton}`}
							onClick={handleSelectAll}
						>
							Select All
						</button>
						<button
							type="button"
							class={`${styles.actionButton} ${styles.cancelButton}`}
							onClick={props.onClose}
						>
							Cancel
						</button>
						<button
							type="button"
							class={`${styles.actionButton} ${styles.saveButton}`}
							onClick={handleSave}
						>
							Save Changes
						</button>
					</div>
				</dialog>
			</div>
		</Show>
	);
};

export default MapSelectionModal;
