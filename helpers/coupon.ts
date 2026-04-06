type CouponLike = {
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minSubtotal?: number | null;
  maxDiscount?: number | null;
};

export function calculateCouponDiscount(
  subtotal: number,
  coupon: CouponLike | null | undefined,
) {
  if (!coupon || subtotal <= 0) return 0;

  if (coupon.minSubtotal && subtotal < coupon.minSubtotal) {
    return 0;
  }

  let discount = 0;

  if (coupon.type === "PERCENTAGE") {
    discount = (subtotal * coupon.value) / 100;
  } else {
    discount = coupon.value;
  }

  if (coupon.maxDiscount && discount > coupon.maxDiscount) {
    discount = coupon.maxDiscount;
  }

  if (discount > subtotal) {
    discount = subtotal;
  }

  return Number(discount.toFixed(2));
}
