// Turns the backend board into a flat list of cards with server-formatted times.
import type { Board, BoardCard, BoardItem } from "@/types/board";
import { toClock } from "@/utils/date-format";

export function toBoardCard(item: BoardItem): BoardCard {
  return { ...item, atLabel: toClock(item.at), decidedAtLabel: item.decidedBy ? toClock(item.decidedBy.at) : undefined };
}

export function toBoardCards(board: Board): BoardCard[] {
  return [...board.columns.flatMap((column) => column.items), ...board.notes]
    .sort((first, second) => first.number - second.number)
    .map(toBoardCard);
}

export function toIdeaCount(board: Board): number {
  return board.columns.reduce((count, column) => count + column.items.length, 0);
}
