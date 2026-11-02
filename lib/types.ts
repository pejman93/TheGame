export type GameId =
  | "gift-department"
  | "the-haunting"
  | "secret-admirer"
  | "system-breach"
  | "you-won"
  | "case-file"
  | "locked-in"
  | "performance-review"
  | "mission-control"
  | "rigged-quiz";

export interface SurprisePhoto {
  url: string;
}

export interface SurpriseConfig {
  v: 1;
  id: string;
  game: GameId;
  recipientName: string;
  senderName: string;
  age?: number;
  message: string;
  jokes: string[];
  photos: SurprisePhoto[];
  voice: {
    /** The main voice note: normal at the start, warped in the middle, normal at the end. */
    main?: string;
    /** Optional extra line used for the creepy moments. */
    creepy?: string;
  };
  /** ISO timestamp. Before this moment the package stays sealed. */
  unlockAt?: string;
  createdAt: string;
}

/** What the create page sends to the API (server fills id/createdAt). */
export type SurpriseInput = Omit<SurpriseConfig, "v" | "id" | "createdAt">;
