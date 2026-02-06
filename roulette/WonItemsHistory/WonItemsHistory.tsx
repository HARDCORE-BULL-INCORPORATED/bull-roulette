/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
import type { Component } from "solid-js";
import { For, Show } from "solid-js";
import type { CaseItem } from "../types";
import RouletteItem from "../RouletteDisplay/RouletteItem";
import styles from "./WonItemsHistory.module.css";

export interface WonItemsHistoryProps {
	items: CaseItem[];
	title: string;
	itemWidth?: number;
	onItemClick?: (item: CaseItem) => void;
	onClearHistory?: () => void;
}

const WonItemsHistory: Component<WonItemsHistoryProps> = (props) => {
	const width = () => props.itemWidth || 140;

	return (
		<Show when={props.items.length > 0}>
			<div class={styles.historyContainer}>
				<div class={styles.historyHeader}>
					<h2 class={styles.historyTitle}>
						{props.title} ({props.items.length})
					</h2>
				</div>
				<Show when={props.onClearHistory}>
					<div class={styles.clearButtonContainer}>
						{" "}
						{/* New container for the button */}
						<button
							type="button"
							onClick={() => props.onClearHistory?.()}
							class="cs-btn"
						>
							Clear History
						</button>
					</div>
				</Show>
				<div class={styles.itemsGrid}>
					<For each={props.items}>
						{(item, index) => (
							<div
								class={styles.historyItemContainer}
								onClick={() => props.onItemClick?.(item)}
								onKeyUp={(e) => {
									if (
										(e.key === "Enter" || e.key === " ") &&
										props.onItemClick
									) {
										props.onItemClick(item);
									}
								}}
								tabIndex={props.onItemClick ? 0 : -1}
								role={props.onItemClick ? "button" : undefined}
								style={{ cursor: props.onItemClick ? "pointer" : "default" }}
							>
								<span class={styles.itemIndex}>#{index() + 1}</span>
								<RouletteItem item={item} width={width()} />
							</div>
						)}
					</For>
				</div>
			</div>
		</Show>
	);
};

export default WonItemsHistory;
