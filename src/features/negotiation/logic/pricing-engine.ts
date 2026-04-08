export interface DealParameters {
  basePrice: number;
  targetPrice: number;
  floorPrice: number;
  competitors: string[];
  discountAllowed: number;
}

export interface NegotiationState {
  dealId: string;
  currentOffer: number;
  target: number;
  floor: number;
  leverage: "high" | "medium" | "low";
  buyerUrgency: "high" | "medium" | "low";
  stage: "initial" | "counter" | "final" | "closed";
}

export function calculateOptimalPrice(params: DealParameters): number {
  const { basePrice, targetPrice, floorPrice, discountAllowed } = params;
  
  // Calculate optimal price based on leverage
  const discountMultiplier = 1 - (discountAllowed / 100);
  const optimalPrice = Math.max(
    basePrice * discountMultiplier,
    floorPrice + (targetPrice - floorPrice) * 0.3
  );
  
  return Math.round(optimalPrice);
}

export function assessNegotiationPower(state: NegotiationState): {
  power: "strong" | "moderate" | "weak";
  recommendations: string[];
} {
  const { leverage, buyerUrgency, currentOffer, target, floor } = state;
  
  const recommendations: string[] = [];
  let powerScore = 0;
  
  // Leverage scoring
  if (leverage === "high") powerScore += 3;
  else if (leverage === "medium") powerScore += 1;
  
  // Urgency scoring
  if (buyerUrgency === "high") powerScore += 2;
  else if (buyerUrgency === "medium") powerScore += 1;
  
  // Position scoring
  const distanceFromTarget = currentOffer - target;
  const distanceFromFloor = currentOffer - floor;
  
  if (distanceFromTarget <= 0) {
    powerScore += 2;
    recommendations.push("You have reached or exceeded your target");
  } else if (distanceFromFloor <= 0) {
    recommendations.push("Warning: You're at or below your floor price");
  }
  
  let power: "strong" | "moderate" | "weak";
  if (powerScore >= 5) power = "strong";
  else if (powerScore >= 3) power = "moderate";
  else power = "weak";
  
  return { power, recommendations };
}

export function generateCounterOffer(state: NegotiationState): number {
  const { currentOffer, target, floor, stage } = state;
  
  let counterOffer: number;
  
  if (stage === "counter") {
    // Move 40% closer to target from current position
    counterOffer = currentOffer + (target - currentOffer) * 0.4;
  } else if (stage === "final") {
    // Move 70% closer to target
    counterOffer = currentOffer + (target - currentOffer) * 0.7;
  } else {
    counterOffer = currentOffer + (target - currentOffer) * 0.2;
  }
  
  return Math.round(Math.max(counterOffer, floor));
}