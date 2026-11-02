import type { GameId } from "@/lib/types";
import type { GameScript } from "./types";
import { giftDepartment } from "./gift-department";
import { theHaunting } from "./the-haunting";
import { secretAdmirer } from "./secret-admirer";

export const SCRIPTS: Partial<Record<GameId, GameScript>> = {
  "gift-department": giftDepartment,
  "the-haunting": theHaunting,
  "secret-admirer": secretAdmirer,
};
