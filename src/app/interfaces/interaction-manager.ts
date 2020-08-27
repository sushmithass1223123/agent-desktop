export interface ActiveInteraction {
    type: string;
    interactionId: number;
}

export interface InteractionRef extends ActiveInteraction {
    isActive: boolean;
    status: string;
    user: string;
    path: string;
    otherData?: any;
}

export interface InteractionCount {
    total: number;
    active: number;
}
