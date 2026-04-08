import type { DealParameters, NegotiationState } from "./pricing-engine";

interface NegotiationAction {
  type: "offer" | "accept" | "reject" | "counter" | "concede";
  value?: number;
  reason: string;
}

interface NegotiationAgentResult {
  recommendedAction: NegotiationAction;
  reasoning: string;
  risk: "low" | "medium" | "high";
}

export function analyzeNegotiation(
  state: NegotiationState,
  dealParams: DealParameters
): NegotiationAgentResult {
  const { currentOffer, target, floor, stage, leverage, buyerUrgency } = state;
  const distanceToTarget = currentOffer - target;
  const distanceToFloor = currentOffer - floor;
  
  // Analyze the situation
  let recommendedAction: NegotiationAction;
  let reasoning: string;
  let risk: "low" | "medium" | "high" = "medium";
  
  if (stage === "initial") {
    if (leverage === "high" && buyerUrgency === "high") {
      recommendedAction = { type: "offer", value: target, reason: "Strong position" };
      reasoning = "You have high leverage and the buyer has urgency. Push for target price.";
      risk = "low";
    } else if (leverage === "low") {
      recommendedAction = { type: "concede", value: undefined, reason: "Weak leverage" };
      reasoning = "Your leverage is low. Consider offering concessions to maintain the deal.";
      risk = "high";
    } else {
      recommendedAction = { type: "offer", value: (currentOffer + target) / 2, reason: "Standard approach" };
      reasoning = "Neutral position. Make a reasonable offer.";
    }
  } else if (stage === "counter") {
    if (distanceToTarget <= 0) {
      recommendedAction = { type: "accept", reason: "Target achieved" };
      reasoning = "The offer meets your target. Accept to close the deal.";
      risk = "low";
    } else if (distanceToFloor <= 0) {
      recommendedAction = { type: "reject", reason: "Below floor" };
      reasoning = "The offer is below your floor. Reject or make a final counter.";
      risk = "high";
    } else {
      recommendedAction = { type: "counter", reason: "Room for negotiation" };
      reasoning = "There's still room to negotiate. Make a counter offer.";
    }
  } else if (stage === "final") {
    if (distanceToTarget <= (target - floor) * 0.2) {
      recommendedAction = { type: "accept", reason: "Close to target" };
      reasoning = "Accept to close the deal. This is within your acceptable range.";
      risk = "low";
    } else {
      recommendedAction = { type: "reject", reason: "Not acceptable" };
      reasoning = "The final offer is not acceptable. Be prepared to walk away.";
      risk = "high";
    }
  } else {
    recommendedAction = { type: "accept", reason: "Deal closed" };
    reasoning = "The deal has been closed.";
  }
  
  return {
    recommendedAction,
    reasoning,
    risk,
  };
}

export function predictWinProbability(state: NegotiationState): number {
  const { currentOffer, target, floor, leverage, buyerUrgency } = state;
  
  let probability = 0.5;
  
  // Price positioning
  const priceRange = floor - target;
  const positionFromFloor = (currentOffer - floor) / priceRange;
  
  if (positionFromFloor >= 0.8) probability += 0.3;
  else if (positionFromFloor >= 0.5) probability += 0.1;
  else probability -= 0.1;
  
  // Leverage impact
  if (leverage === "high") probability += 0.15;
  else if (leverage === "low") probability -= 0.15;
  
  // Urgency impact
  if (buyerUrgency === "high") probability += 0.1;
  else if (buyerUrgency === "low") probability -= 0.1;
  
  return Math.min(Math.max(probability, 0), 1);
}