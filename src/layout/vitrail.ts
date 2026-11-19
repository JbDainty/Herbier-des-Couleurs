/** Geometry uses the measured safe viewport, with fixed space for every command. */
export function vitrailLayout(width: number, height: number, size: number, fontScale = 1) {
  const landscape = width >= 480 && width > height * 1.15;
  const tight = height < 650 || landscape;
  const padding = tight ? 4 : 10;
  const gap = height < 600 ? 1 : 6;
  const contentWidth = Math.min(width, 1120) - padding * 2;
  const contentHeight = height - padding * 2;
  const headerHeight = tight ? 44 : 108;
  const stagesHeight = 44;
  const captionHeight = Math.ceil((tight ? 22 : 26) * Math.min(1.2, Math.max(1, fontScale)));
  const actionsHeight = 48;
  const footerInset = tight ? 4 : 6;
  const footerHeight = actionsHeight + footerInset * 2;
  if (landscape) {
    const boardSize = Math.floor(
      Math.max(0, Math.min(contentHeight, contentWidth - 240 - gap, 660)),
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
      panelHeight: contentHeight,
      controlsWidth,
      actionWidth: Math.min(420, controlsWidth),
      cellSize: boardSize / (size + 1),
    };
  }
  const panelHeight = contentHeight - headerHeight - stagesHeight - footerHeight - gap * 3;
  // Native foliage occupies the outer 28-point side strips and 48-point end strips.
  // Use its frame only when a full-size touch grid fits inside that reserved area.
  const minimumBoard = (size + 1) * 44;
  const framed =
    !tight &&
    contentWidth - 64 >= minimumBoard &&
    panelHeight - 96 - captionHeight - actionsHeight - gap * 2 >= minimumBoard;
  const panelPadding = framed ? 32 : tight ? 0 : 8;
  const panelVerticalPadding = framed ? 48 : tight ? 0 : 8;
  const boardAreaHeight =
    panelHeight - panelVerticalPadding * 2 - captionHeight - actionsHeight - gap * 2;
  const boardSize = Math.floor(
    Math.max(0, Math.min(contentWidth - panelPadding * 2, boardAreaHeight, 660)),
  );
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
    boardAreaHeight,
    panelHeight,
    controlsWidth: contentWidth,
    actionWidth: Math.min(420, contentWidth - panelPadding * 2),
    cellSize: boardSize / (size + 1),
  };
}
