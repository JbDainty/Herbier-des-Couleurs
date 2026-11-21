type Options = { height: number; tubes: number; fontScale: number; hintHeight?: number };
/** Shared by the menu's preparation and the first rendered workshop frame. */
export function workshopLayout(
  windowWidth: number,
  viewportWidth = windowWidth,
  options?: Options,
) {
  const height = options?.height || 800;
  const width = Math.min(viewportWidth || windowWidth, 1180);
  const landscape = width >= 480 && width > height * 1.2 && height < 520;
  const tiny = height < 600;
  const compact = height < 680;
  const wide = width > 1100 && height >= 600;
  const padding = width < 800 ? 8 : 16;
  const gap = wide ? 18 : 4;
  const content = Math.max(0, width - padding * 2);
  const boardWidth = wide ? (content - gap) * 0.64 : content;
  const hudHeight = landscape ? 48 : tiny ? 60 : 56;
  const captionHeight = tiny || landscape ? 0 : compact ? 80 : 92;
  const hintWidth = landscape ? Math.max(180, boardWidth * 0.44 - 4) : Math.min(580, boardWidth);
  const actionsWidth = Math.min(480, landscape ? boardWidth - hintWidth - 4 : boardWidth);
  const actionHorizontalPadding = 6;
  const actionVerticalPadding = 12;
  const actionContentGap = 4;
  const showActionLabels = !landscape || actionsWidth >= 320;
  const actionIconSize = compact ? 32 : 40;
  const cellWidth = (actionsWidth - actionHorizontalPadding * 2 - 12 - 2) / 4;
  const actionLabelSize = Math.min(compact ? 14 : 15, Math.floor((cellWidth / 5.7) * 2) / 2);
  const actionLabelLine = compact ? 18 : 20;
  const actionLabelHeight = Math.ceil(actionLabelLine * Math.min(options?.fontScale || 1, 1.15));
  const actionContentHeight = Math.max(
    44,
    actionIconSize + (showActionLabels ? actionContentGap + actionLabelHeight : 0),
  );
  // Preserve the toolbar footprint while giving the illustrated icons more room.
  const actionsHeight = Math.max(96, actionContentHeight + actionVerticalPadding * 2);
  const hintHeight = options?.hintHeight || 56;
  const footerHeight = landscape
    ? Math.max(actionsHeight, hintHeight)
    : actionsHeight + hintHeight + 4;
  const boardHeight = Math.max(
    90,
    height - hudHeight - captionHeight - footerHeight - padding * 2 - 8,
  );
  return {
    wide,
    landscape,
    tiny,
    compact,
    padding,
    maxWidth: 1180,
    gap,
    boardWidth,
    boardHeight,
    hudHeight,
    captionHeight,
    actionsHeight,
    actionIconSize,
    actionLabelSize,
    actionLabelLine,
    actionLabelHeight,
    actionHorizontalPadding,
    actionVerticalPadding,
    actionContentGap,
    showActionLabels,
    actionsWidth,
    hintWidth,
    hintHeight,
    footerHeight,
    height,
  };
}
