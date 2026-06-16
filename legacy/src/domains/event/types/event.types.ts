export interface EventSearchResultDTO {
  readonly id: string;
  readonly code: number;
  readonly name: string;
  readonly address: string | null;
  readonly date: string;
  readonly bannerImage: string | null;
}
