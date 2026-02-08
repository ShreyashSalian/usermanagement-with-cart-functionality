export const orderPlacedTemplate = ({
  orderId,
  amount,
  items,
}: {
  orderId: string;
  amount: number;
  items: any[];
}) => {
  return `
    <h2>🎉 Order Confirmed!</h2>
    <p>Your order <b>#${orderId}</b> has been placed successfully.</p>

    <h3>Order Summary</h3>
    <ul>
      ${items
        .map((item) => `<li>${item.productName} × ${item.quantity}</li>`)
        .join("")}
    </ul>

    <p><b>Total Paid:</b> ₹${amount}</p>

    <p>Thank you for shopping with us ❤️</p>
  `;
};
