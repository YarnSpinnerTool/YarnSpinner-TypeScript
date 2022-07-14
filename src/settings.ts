export enum LineDeliveryMode {
    /** Deliver lines one-at-a-time, and require an explicit action before
     * proceeding to the next line. */
    OneAtATime,

    /** Deliver lines all at once, stopping only when the user needs to choose
     * an option. */
    AllAtOnce
}

export type Settings = {
    /** Controls the way that lines are delivered to the user. */
    lineDelivery?: LineDeliveryMode;

    /** Controls whether the contents of variables are shown to the user. */
    showVariables?: boolean;

    /** Controls whether options marked as unavailable are shown to the user. */
    showUnavailableOptions?: boolean;
};
