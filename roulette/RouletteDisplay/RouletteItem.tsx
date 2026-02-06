import type { Component } from "solid-js";
import type { CaseItem } from "../types";
import { getItemColor } from "../utils";
import styles from "./RouletteItem.module.css";

interface RouletteItemProps {
	item: CaseItem;
	width?: number;
	isWinner?: boolean;
}

const RouletteItem: Component<RouletteItemProps> = (props) => {
	const itemWidth = props.width || 140;
	const rarityColor = getItemColor(props.item);

	return (
		<div
			class={`${styles.itemContainer} ${props.isWinner ? styles.winner : ""}`}
			style={{
				width: `${itemWidth}px`,
				height: `${itemWidth}px`,
				"--rarity-color": rarityColor,
			}}
		>
			<div class={styles.itemContent}>
				<div class={styles.itemImageContainer}>
					{props.item.image ? (
						<img
							src={props.item.image}
							alt={props.item.name}
							class={styles.itemImage}
						/>
					) : (
						<span class={styles.itemNameOnly}>{props.item.name}</span>
					)}
				</div>
				<div class={styles.itemInfo}>
					<div class={styles.itemName} title={props.item.name}>
						{props.item.name}
					</div>
				</div>
			</div>
		</div>
	);
};

export default RouletteItem;
