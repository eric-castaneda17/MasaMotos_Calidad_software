export type CartLine = {
  productId: number;
  code: string;
  name: string;
  unitPrice: number;
  stock: number;
  quantity: number;
};

export type PaymentMethodOption = { id: number; code: string; name: string };
