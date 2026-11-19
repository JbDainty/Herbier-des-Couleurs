/** The date grid can scroll on exceptionally short windows; month controls and Close stay visible. */
export function vitrailCalendarLayout(width: number, height: number, rows: number) {
  const landscape = width >= 440 && width > height * 1.25;
  const compact = height < 690 || landscape;
  const minimal = !landscape && height < 320;
  const padding = compact ? 12 : 20,
    gap = compact ? 4 : 8;
  const paperWidth = Math.min(width, landscape ? 900 : 540);
  const innerWidth = paperWidth - padding * 2;
  const headerHeight = compact ? 0 : 52,
    monthHeight = 44,
    weekHeight = compact ? 14 : 16;
  const summaryHeight = minimal ? 0 : compact ? 20 : 28,
    legendHeight = minimal ? 0 : compact ? 24 : 26;
  const noteHeight = minimal ? 0 : 16,
    closeHeight = 48;
  if (landscape) {
    const sideWidth = Math.min(240, Math.max(164, innerWidth * 0.34));
    const columnGap = 12,
      gridWidth = innerWidth - sideWidth - columnGap;
    const cellHeight = Math.max(
      36,
      Math.min(62, Math.floor((height - padding * 2 - monthHeight - weekHeight - gap * 2) / rows)),
    );
    const gridHeight = Math.min(
      rows * cellHeight,
      Math.max(80, height - padding * 2 - monthHeight - weekHeight - gap * 2),
    );
    const leftHeight = monthHeight + weekHeight + gridHeight + gap * 2;
    const tightSide = height - padding * 2 < 300;
    const sideMinimum = tightSide ? 156 : 298;
    const paperHeight = Math.min(height, Math.max(leftHeight, sideMinimum) + padding * 2);
    return {
      landscape,
      compact,
      padding,
      gap,
      paperWidth,
      paperHeight,
      innerWidth,
      headerHeight,
      monthHeight,
      weekHeight,
      summaryHeight,
      legendHeight,
      noteHeight,
      closeHeight,
      sideWidth,
      columnGap,
      tightSide,
      gridWidth,
      cellWidth: gridWidth / 7,
      cellHeight,
      gridHeight,
      gridContentHeight: rows * cellHeight,
    };
  }
  const fixed =
    padding * 2 +
    headerHeight +
    monthHeight +
    weekHeight +
    summaryHeight +
    legendHeight +
    noteHeight +
    closeHeight +
    gap *
      (3 +
        (headerHeight ? 1 : 0) +
        (summaryHeight ? 1 : 0) +
        (legendHeight ? 1 : 0) +
        (noteHeight ? 1 : 0));
  const cellHeight = Math.max(36, Math.min(62, Math.floor((height - fixed) / rows)));
  const gridHeight = Math.min(rows * cellHeight, Math.max(32, height - fixed));
  return {
    landscape,
    compact,
    padding,
    gap,
    paperWidth,
    paperHeight: Math.min(height, fixed + gridHeight),
    innerWidth,
    headerHeight,
    monthHeight,
    weekHeight,
    summaryHeight,
    legendHeight,
    noteHeight,
    closeHeight,
    sideWidth: 0,
    columnGap: 0,
    tightSide: false,
    gridWidth: innerWidth,
    cellWidth: innerWidth / 7,
    cellHeight,
    gridHeight,
    gridContentHeight: rows * cellHeight,
  };
}
