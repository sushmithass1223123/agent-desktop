export interface ActiveInteraction {
    /**
     * Interaction type
     */
    type: string;
    /**
     * Interaction Id
     */
    interactionId: number;
}

export interface InteractionRef extends ActiveInteraction {
    /**
     * Active interaction flag
     */
    isActive: boolean;
    /**
     * Is Email Sent interaction flag
     */
    isEmailSent: boolean | null | undefined;
    /**
     * Interaction status
     */
    status: string;
    /**
     * Interaction User
     */
    user: string;
    /**
     * Interaction Path
     */
    path: string;
    /**
     * Other intreaction data
     */
    otherData?: any;
}

export interface InteractionCount {
    /**
     * Total interactiyon
     */
    total: number;
    /**
     * Active interaction
     */
    active: number;
}
