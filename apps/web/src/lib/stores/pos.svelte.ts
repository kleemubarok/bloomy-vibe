import type { CartItem, Product } from '$lib/api/types';

export interface PosState {
	items: CartItem[];
	customerName: string;
	customerWhatsapp: string;
	isProcessing: boolean;
	error: string | null;
}

export function createPosStore() {
	let state = $state<PosState>({
		items: [],
		customerName: '',
		customerWhatsapp: '',
		isProcessing: false,
		error: null
	});

	function addToCart(product: Product) {
		const existing = state.items.find(item => item.productId === product.id);
		if (existing) {
			existing.quantity += 1;
		} else {
			state.items = [...state.items, {
				productId: product.id,
				productName: product.name,
				quantity: 1,
				unitPrice: product.basePrice
			}];
		}
	}

	function removeFromCart(productId: number) {
		state.items = state.items.filter(item => item.productId !== productId);
	}

	function updateQuantity(productId: number, quantity: number) {
		if (quantity <= 0) {
			removeFromCart(productId);
			return;
		}
		const item = state.items.find(item => item.productId === productId);
		if (item) {
			item.quantity = quantity;
		}
	}

	function getTotal(): number {
		return state.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
	}

	function getItemCount(): number {
		return state.items.reduce((sum, item) => sum + item.quantity, 0);
	}

	function clearCart() {
		state.items = [];
		state.customerName = '';
		state.customerWhatsapp = '';
		state.error = null;
	}

	function setCustomerName(name: string) {
		state.customerName = name;
	}

	function setCustomerWhatsapp(whatsapp: string) {
		state.customerWhatsapp = whatsapp;
	}

	function setProcessing(processing: boolean) {
		state.isProcessing = processing;
	}

	function setError(error: string | null) {
		state.error = error;
	}

	return {
		get items() { return state.items; },
		get customerName() { return state.customerName; },
		get customerWhatsapp() { return state.customerWhatsapp; },
		get isProcessing() { return state.isProcessing; },
		get error() { return state.error; },
		addToCart,
		removeFromCart,
		updateQuantity,
		getTotal,
		getItemCount,
		clearCart,
		setCustomerName,
		setCustomerWhatsapp,
		setProcessing,
		setError
	};
}

export const posStore = createPosStore();
