export interface TwCreateInteraction {
    Channels: TwCreateInteractionChannel[];
}

export interface TwCreateInteractionChannel {
    /**
     * Channel name
     */
    Name: string;
    /**
     * Channel enabled flag
     */
    Enabled: boolean;
    /**
     * Channel enable state
     */
    EnableState: string;
    /**
     * Type of channel
     */
    Type: string;
    /**
     * Subtype of channel
     */
    SubType: string;
    /**
     * Icon for the channel
     */
    Icon: string;
    /**
     * Data for the channel
     */
    Data: {
        Source: {
            Use: string;
            Display: string;
            FreeTextAllowed: boolean;
        };
        AllowedStates: string[];
        TeamFilter: boolean;
        Columns: string[];
    };
}
