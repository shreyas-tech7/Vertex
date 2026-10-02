/** What to do with a file dropped on the calculator. */
export type DroppedFileKind = 'rom' | 'variable' | 'unsupported';

/**
 * TI variable and app files all have an extension that starts with 8 (.8xp .8xv .8xg .8xl .8xm .8xs .8xn .8xc ...).
 * OS upgrade files (.8eu) are not variables and are refused. A .rom file, or anything of megabyte size with
 * another name, is treated as a calculator ROM.
 */
export function classifyDroppedFile(name: string, size: number): DroppedFileKind {
  const extension = /\.([a-z0-9]+)$/i.exec(name)?.[1]?.toLowerCase() ?? '';
  if (extension === 'rom') return 'rom';
  if (extension === '8eu') return 'unsupported';
  if (/^8[0-9a-z][0-9a-z]$/.test(extension)) return 'variable';
  if (size >= 1024 * 1024) return 'rom';
  return 'unsupported';
}
