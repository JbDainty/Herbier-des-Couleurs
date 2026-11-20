/** Geometry uses the measured safe viewport, with fixed space for every command. */
export function vitrailLayout(
  width: number,
  height: number,
  size: number,
  fontScale = 1,
  won = false,
) {
  const landscape = width >= 480 && width > height * 1.15;
  const tight = height < 650 || landscape;
  const padding = tight ? 4 : 10;
  const gap = height < 600 ? 1 : 6;
  const contentWidth = Math.min(width, 1120) - padding * 2;
  const contentHeight = height - padding * 2;
  const headerHeight = tight ? 44 : 108;
  const stagesHeight = 44;
  const playingCaptionHeight = Math.ceil((tight ? 22 : 26) * Math.min(1.2, Math.max(1, fontScale)));
  const captionHeight = won ? 0 : playingCaptionHeight;
  const actionsHeight = 48;
  const footerInset = tight ? 4 : 6;
  const footerHeight = actionsHeight + footerInset * 2;
  if (landscape) {
    const boardSize = Math.floor(
      Math.max(0, Math.min(contentHeight, contentWidth - 240 - gap, 720)),
    );
    const controlsWidth = contentWidth - boardSize - gap;
    return {
      landscape,
      tight,
      padding,
      gap,
      contentWidth,
      contentHeight,
      headerHeight,
      stagesHeight,
      captionHeight,
      actionsHeight,
      footerHeight,
      footerInset,
      panelPadding: 0,
      panelVerticalPadding: 0,
      framed: false,
      boardSize,
      boardAreaHeight: contentHeight,
      playAreaHeight: contentHeight,
      panelWidth: boardSize,
      panelHeight: boardSize,
      controlsWidth,
      actionWidth: Math.min(420, controlsWidth),
      cellSize: boardSize / (size + 1),
    };
  }
  const playAreaHeight = contentHeight - headerHeight - stagesHeight - footerHeight - gap * 3;
  // Keep the existing threshold for foliage, then use its slimmer border to grow the board.
  const minimumBoard = (size + 1) * 44;
  const framed =
    !tight &&
    contentWidth - 64 >= minimumBoard &&
    playAreaHeight - 96 - playingCaptionHeight - actionsHeight - gap * 2 >= minimumBoard;
  const panelPadding = framed ? 16 : tight ? 0 : 8;
  const panelVerticalPadding = framed ? 20 : tight ? 0 : 8;
  // Reserve the in-game caption even after a win so cells keep the same size.
  const boardBudget =
    playAreaHeight - panelVerticalPadding * 2 - playingCaptionHeight - actionsHeight - gap * 2;
  const boardSize = Math.floor(
    Math.max(0, Math.min(contentWidth - panelPadding * 2, boardBudget, 720)),
  );
  const panelHeight =
    boardSize + captionHeight + actionsHeight + gap * (won ? 1 : 2) + panelVerticalPadding * 2;
  const panelWidth = Math.min(contentWidth, Math.max(boardSize, 280) + panelPadding * 2);
  return {
    landscape,
    tight,
    padding,
    gap,
    contentWidth,
    contentHeight,
    headerHeight,
    stagesHeight,
    captionHeight,
    actionsHeight,
    footerHeight,
    footerInset,
    panelPadding,
    panelVerticalPadding,
    framed,
    boardSize,
    boardAreaHeight: boardSize,
    playAreaHeight,
    panelWidth,
    panelHeight,
    controlsWidth: contentWidth,
    actionWidth: Math.min(420, panelWidth - panelPadding * 2),
    cellSize: boardSize / (size + 1),
  };
}
