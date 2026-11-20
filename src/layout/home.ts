/** Fit the two playable modes and the smaller future teaser inside the safe viewport. */
export function homeLayout(width: number, height: number, fontScale = 1) {
  const horizontal = width >= 480 && width > height * 1.12;
  const short = horizontal && height < 430;
  const tight = height < 600 || (fontScale > 1.1 && height < 720);
  const padding = short ? 6 : tight ? 8 : 14;
  const gap = short ? 4 : tight ? 6 : 10;
  const pageWidth = Math.max(0, Math.min(1040, width) - padding * 2);
  const headerHeight = short ? 44 : tight ? 56 : 92;
  const footerHeight = short ? 54 : tight ? 92 : 108;
  const bodyHeight = Math.max(0, height - padding * 2 - headerHeight - footerHeight - gap * 2);
  const headingHeight =
    !horizontal && height < 440
      ? 0
      : Math.ceil((short ? 24 : tight ? 26 : 32) * Math.min(1.2, fontScale));
  const mainWidth = horizontal ? pageWidth * 0.57 : Math.min(620, pageWidth);
  const sideWidth = horizontal ? pageWidth - mainWidth - gap : mainWidth;
  const mysteryHeight = short || tight || height < 700 ? 44 : 56;
  const modeSpace = Math.max(0, bodyHeight - headingHeight - gap * (headingHeight ? 1 : 0));
  const available = horizontal ? modeSpace : modeSpace - mysteryHeight - gap * 2;
  const mainHeight = horizontal
    ? Math.min(310, modeSpace)
    : Math.max(100, Math.min(300, Math.floor(available * 0.53)));
  const dailyHeight = horizontal
    ? Math.min(260, mainHeight - mysteryHeight - gap)
    : Math.min(272, available - mainHeight);
  return {
    horizontal,
    short,
    tight,
    padding,
    gap,
    pageWidth,
    headerHeight,
    footerHeight,
    bodyHeight,
    headingHeight,
    mainWidth,
    sideWidth,
    mainHeight,
    dailyHeight,
    mysteryHeight,
  };
}
