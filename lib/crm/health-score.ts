export function computeHealthScore({
  lastOrderDate,
  orderCount,
  totalSpend,
}: {
  lastOrderDate: Date | null;
  orderCount: number;
  totalSpend: number;
}): {
  score: number;
  category: "HEALTHY" | "ACTIVE" | "AT_RISK" | "LOST";
  recencyScore: number;
  frequencyScore: number;
  monetaryScore: number;
} {
  // Recency (0–100, weight 40%)
  let recencyScore = 0;
  if (lastOrderDate) {
    const days = Math.floor(
      (Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days <= 7) recencyScore = 100;
    else if (days <= 14) recencyScore = 85;
    else if (days <= 30) recencyScore = 70;
    else if (days <= 60) recencyScore = 50;
    else if (days <= 90) recencyScore = 30;
    else if (days <= 180) recencyScore = 15;
    else recencyScore = 0;
  }

  // Frequency (0–100, weight 30%)
  let frequencyScore = 0;
  if (orderCount >= 10) frequencyScore = 100;
  else if (orderCount >= 7) frequencyScore = 80;
  else if (orderCount >= 5) frequencyScore = 60;
  else if (orderCount >= 3) frequencyScore = 40;
  else if (orderCount === 2) frequencyScore = 20;
  else if (orderCount === 1) frequencyScore = 10;

  // Monetary (0–100, weight 30%)  — in piasters
  const spendEGP = totalSpend / 100;
  let monetaryScore = 0;
  if (spendEGP >= 50000) monetaryScore = 100;
  else if (spendEGP >= 20000) monetaryScore = 80;
  else if (spendEGP >= 10000) monetaryScore = 60;
  else if (spendEGP >= 5000) monetaryScore = 40;
  else if (spendEGP >= 1000) monetaryScore = 20;
  else if (spendEGP > 0) monetaryScore = 10;

  const score = Math.round(
    recencyScore * 0.4 + frequencyScore * 0.3 + monetaryScore * 0.3
  );

  let category: "HEALTHY" | "ACTIVE" | "AT_RISK" | "LOST";
  if (score >= 75) category = "HEALTHY";
  else if (score >= 50) category = "ACTIVE";
  else if (score >= 25) category = "AT_RISK";
  else category = "LOST";

  return { score, category, recencyScore, frequencyScore, monetaryScore };
}
