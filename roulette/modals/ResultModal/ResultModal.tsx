/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
import type { Component } from "solid-js";
import { Show } from "solid-js";
import type { CaseItem } from "../../types";
import { getItemColor } from "../../utils";
import styles from "./ResultModal.module.css";

interface ResultModalProps {
	isOpen: boolean;
	onClose: () => void;
	item: CaseItem | null;
}

const ResultModal: Component<ResultModalProps> = (props) => {
	const handleBackdropClick = (e: Event) => {
		if ((e.target as HTMLElement) === (e.currentTarget as HTMLElement)) {
			props.onClose();
		}
	};

	return (
		<Show when={props.isOpen && props.item}>
			<div
				class={styles.modalBackdrop}
				onClick={(e) => handleBackdropClick(e)}
				onKeyDown={(e) => {
					if ((e as KeyboardEvent).key === "Escape") props.onClose();
				}}
				role="presentation"
			>
				<div class={styles.modalContent}>
					<button
						class={styles.closeButton}
						onClick={() => props.onClose()}
						aria-label="Close"
						type="button"
					>
						×
					</button>

					<h2 class={styles.resultTitle}>You Won!</h2>

					<div class={styles.resultItem}>
						{props.item?.image ? (
							<img
								src={props.item.image}
								alt={props.item.name}
								class={styles.resultImage}
							/>
						) : (
							<div class={styles.resultNameOnlyContainer}>
								<span class={styles.resultNameOnly}>{props.item?.name}</span>
							</div>
						)}
						<h3
							class={styles.resultName}
							style={{
								color: props.item ? getItemColor(props.item) : undefined,
							}}
						>
							{props.item?.name}
						</h3>
						<p
							class={styles.resultRarity}
							style={{
								color: props.item ? getItemColor(props.item) : undefined,
							}}
						>
							{props.item?.rarity}
						</p>
						{props.item?.description && (
							<p class={styles.resultDescription}>{props.item.description}</p>
						)}
					</div>
				</div>
			</div>
		</Show>
	);
};

export default ResultModal;
