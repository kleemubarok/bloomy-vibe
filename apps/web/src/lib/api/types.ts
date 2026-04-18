export type OrderStatus =
	| 'Draft'
	| 'Antri'
	| 'Dirangkai'
	| 'Selesai'
	| 'Diambil'
	| 'Dikirim'
	| 'Batal';
export type PaymentStatus = 'Pending' | 'Paid' | 'Partial' | 'Refunded';
export type OrderType = 'POS' | 'Self-Order';

export interface OrderItem {
	id: string;
	productId: number;
	productName?: string;
	quantity: number;
	unitPriceAtOrder: number;
	unitPrice?: number;
	notes?: string;
}

export interface Order {
	id: string;
	customerName: string;
	customerWhatsapp?: string;
	totalAmount: number;
	discountAmount: number;
	status: OrderStatus;
	paymentStatus: PaymentStatus;
	orderType: OrderType;
	deliveryDate?: Date;
	messageCard?: string;
	senderName?: string;
	totalHppSnapshot?: number;
	priceLockedAt?: Date;
	isSynced: boolean;
	createdAt: Date;
	updatedAt: Date;
	items?: OrderItem[];
}

export interface ProductionState {
	orders: Order[];
	isLoading: boolean;
	error: string | null;
	lastFetched: Date | null;
}

export interface CartItem {
	productId: number;
	productName: string;
	quantity: number;
	unitPrice: number;
}
