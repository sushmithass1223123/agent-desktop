export interface ActiveInteraction {
    type: string;
    interactionId: number;
}

export interface InteractionRef extends ActiveInteraction {
    isActive: boolean;
    status: string;
}
