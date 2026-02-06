import type { CaseItem } from "./types";
import { RARITY_COLORS } from "./types"; 

export const getItemColor = (item: CaseItem): string => {
	return RARITY_COLORS[item.rarity] || RARITY_COLORS.Consumer;
};

// Select a weighted random item from the array
export const selectWeightedRandomItem = (items: CaseItem[]): CaseItem => {
	const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1), 0);

	const randomValue = Math.random() * totalWeight;

	let weightSum = 0;
	for (const item of items) {
		weightSum += item.weight || 1;
		if (randomValue <= weightSum) {
			return item;
		}
	}

	// Fallback to first item (should never happen with positive weights)
	return items[0];
};

export const generateRouletteItems = (
	currentItems: CaseItem[],
	spinDuration: number, 
	itemsInViewCount: number,
) => {
	if (!currentItems || !currentItems.length) return [];

	// Determine the total number of items to generate for the reel
	// More items for longer spin durations to give the illusion of spinning through more content.
	const itemsPerSecondFactor = 25; // Adjust this to control how many items "pass by" per second
	const minTotalItems = Math.max(150, itemsInViewCount * 10); // Minimum items for a decent visual
	const calculatedItemsBasedOnDuration = spinDuration * itemsPerSecondFactor;

	let totalItemsToGenerate = Math.max(
		minTotalItems,
		calculatedItemsBasedOnDuration,
	);
	// Add an upper cap to prevent performance issues with extremely long reels
	totalItemsToGenerate = Math.min(totalItemsToGenerate, 3000);

	const generatedItems: CaseItem[] = [];

	const allWeightsZero = currentItems.every((item) => item.weight === 0);

	for (let i = 0; i < totalItemsToGenerate; i++) {
		let chosenItem: CaseItem | null = null;

		if (allWeightsZero && currentItems.length > 0) {
			// If all weights are zero (and list is not empty), pick uniformly.
			const randomIndex = Math.floor(Math.random() * currentItems.length);
			chosenItem = currentItems[randomIndex];
		} else if (currentItems.length > 0) {
			// Use weighted selection.
			chosenItem = selectWeightedRandomItem(currentItems);
		}

		if (chosenItem) {
			// Clone the chosen item and assign a unique ID for this slot in the reel.
			const itemForReel = {
				...chosenItem,
				id: `reel-item-${i}-${Date.now()}`,
			};
			generatedItems.push(itemForReel);
		} else if (currentItems.length > 0) {
			// Fallback if chosenItem is null
			const fallbackItem = {
				...currentItems[Math.floor(Math.random() * currentItems.length)], // Pick a random one as fallback
				id: `reel-item-fallback-${i}-${Date.now()}`,
			};
			generatedItems.push(fallbackItem);
			console.warn("CSGOCaseRoulette: Used fallback in generateRouletteItems.");
		}
	}
	return generatedItems;
};
