export interface IPageBot {
  compute(
    branchId: string,
    context?: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
}
