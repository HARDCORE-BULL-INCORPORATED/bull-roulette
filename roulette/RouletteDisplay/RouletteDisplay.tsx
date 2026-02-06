import type { Component, Accessor } from "solid-js";
import { For } from "solid-js";
import type { CaseItem } from "../types";
import RouletteItem from "./RouletteItem";
import styles from "./RouletteDisplay.module.css";
import SpinButton from "./SpinButton";

interface RouletteDisplayProps {
	isSpinning: Accessor<boolean>;
	spinOffset: Accessor<number>;
	rouletteItems: Accessor<CaseItem[]>;
	itemWidth: Accessor<number>;
	assignTrackRef: (el: HTMLDivElement) => void;
	onSpinClick: () => void;
	isSpinButtonDisabled: Accessor<boolean>;
}

const RouletteDisplay: Component<RouletteDisplayProps> = (props) => {
	return (
		<>
			<div class={styles.rouletteViewport}>
				<div class={styles.indicator} />
				<div
					ref={props.assignTrackRef}
					class={`${styles.rouletteTrack} ${props.isSpinning() ? styles.spinning : ""}`}
					style={{
						left: `-${props.spinOffset()}px`,
					}}
				>
					<For each={props.rouletteItems()}>
						{(item) => <RouletteItem item={item} width={props.itemWidth()} />}
					</For>
				</div>
			</div>
			<SpinButton
				onClick={props.onSpinClick}
				isSpinning={props.isSpinning}
				isDisabled={props.isSpinButtonDisabled}
			/>
		</>
	);
};

export default RouletteDisplay;
