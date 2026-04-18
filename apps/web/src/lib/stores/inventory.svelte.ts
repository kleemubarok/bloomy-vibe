import { browser } from '$app/environment';
import {
	getInventory,
	createInventory,
	updateInventory,
	deleteInventory,
	getProductsList,
	createProduct,
	updateProduct,
	deleteProduct,
	type InventoryItem,
	type Product,
	type CreateProductData
} from '$lib/api/client';

export type { InventoryItem, Product, CreateProductData };

export function createInventoryStore() {
	let inventoryItems = $state<InventoryItem[]>([]);
	let products = $state<Product[]>([]);
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	async function fetchInventory(): Promise<void> {
		if (!browser) return;

		isLoading = true;
		error = null;

		try {
			const result = await getInventory();
			inventoryItems = result;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch inventory';
			console.error('Failed to fetch inventory:', e);
		} finally {
			isLoading = false;
		}
	}

	async function addInventoryItem(data: {
		name: string;
		sku?: string;
		unit: string;
		stockLevel?: number;
		reorderLevel?: number;
	}): Promise<InventoryItem> {
		const newItem = await createInventory(data);
		inventoryItems = [...inventoryItems, newItem];
		return newItem;
	}

	async function editInventoryItem(
		id: string,
		data: Partial<InventoryItem>
	): Promise<InventoryItem> {
		const updated = await updateInventory(id, data);
		inventoryItems = inventoryItems.map((item) => (item.id === Number(id) ? { ...item, ...updated } : item));
		return updated;
	}

	async function removeInventoryItem(id: string): Promise<void> {
		await deleteInventory(id);
		inventoryItems = inventoryItems.filter((item) => item.id !== Number(id));
	}

	async function fetchProducts(): Promise<void> {
		if (!browser) return;

		isLoading = true;
		error = null;

		try {
			const result = await getProductsList();
			products = result;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch products';
			console.error('Failed to fetch products:', e);
		} finally {
			isLoading = false;
		}
	}

	async function addProduct(data: CreateProductData): Promise<Product> {
		const newProduct = await createProduct(data);
		products = [...products, { ...newProduct, recipes: newProduct.recipes || [] }];
		return newProduct;
	}

	async function editProduct(id: string, data: Partial<CreateProductData>): Promise<Product> {
		const updated = await updateProduct(id, data);
		products = products.map((p) => (p.id === Number(id) ? { ...p, ...updated, recipes: p.recipes || [] } : p));
		return updated;
	}

	async function removeProduct(id: string): Promise<void> {
		await deleteProduct(id);
		products = products.filter((p) => p.id !== Number(id));
	}

	return {
		get inventoryItems() {
			return inventoryItems;
		},
		get products() {
			return products;
		},
		get isLoading() {
			return isLoading;
		},
		get error() {
			return error;
		},
		fetchInventory,
		fetchProducts,
		addInventoryItem,
		editInventoryItem,
		removeInventoryItem,
		addProduct,
		editProduct,
		removeProduct
	};
}

export const inventoryStore = createInventoryStore();